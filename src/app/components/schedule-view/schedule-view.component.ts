import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../services/cronos-state.service';
import { CalendarService } from '../../services/calendar.service';
import { IconComponent } from '../icon/icon.component';
import { TimeBlock, Task, Course } from '../../../types';
import confetti from 'canvas-confetti';

export interface ScheduleEventItem {
  id: string;
  title: string;
  code?: string;
  courseName?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  technique?: string;
  notes?: string;
  color: string;
  type: 'class' | 'study' | 'break' | 'exam' | 'personal';
  isAiSuggested?: boolean;
  isLocked: boolean;
  isDeletable: boolean;
}

@Component({
  selector: 'app-schedule-view',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './schedule-view.component.html',
})
export class ScheduleViewComponent implements OnInit, OnDestroy {
  readonly state = inject(CronosStateService);
  readonly calendar = inject(CalendarService);

  readonly selectedDayFilter = signal<number | 'all'>('all');
  readonly selectedBlockDetail = signal<ScheduleEventItem | null>(null);
  readonly draggedItem = signal<ScheduleEventItem | null>(null);
  readonly moveError = signal<string | null>(null);

  // Edit / Move form state for selected block
  editDay = signal<number>(1);
  editStartTime = signal<string>('08:00');
  editEndTime = signal<string>('09:30');

  // Exact row height in pixels for 1 hour (7:00 -> 21:00)
  readonly ROW_HEIGHT = 60;

  // Live Time Indicator
  readonly nowTime = signal<Date>(new Date());
  private timeInterval: any = null;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.timeInterval = setInterval(() => {
        this.nowTime.set(new Date());
      }, 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  readonly currentDayOfWeek = computed(() => this.nowTime().getDay());
  readonly currentTimeDecimal = computed(() => {
    const d = this.nowTime();
    return d.getHours() + d.getMinutes() / 60;
  });
  readonly isCurrentTimeVisible = computed(() => {
    const dec = this.currentTimeDecimal();
    return dec >= 7 && dec <= 21;
  });
  readonly currentTimeTop = computed(() => {
    return (this.currentTimeDecimal() - 7) * this.ROW_HEIGHT;
  });
  readonly currentTimeFormatted = computed(() => {
    return this.nowTime().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  handlePrintSchedule(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  readonly DAYS = [
    { day: 1, name: 'Lunes', short: 'Lun' },
    { day: 2, name: 'Martes', short: 'Mar' },
    { day: 3, name: 'Miércoles', short: 'Mié' },
    { day: 4, name: 'Jueves', short: 'Jue' },
    { day: 5, name: 'Viernes', short: 'Vie' },
    { day: 6, name: 'Sábado', short: 'Sáb' },
    { day: 0, name: 'Domingo', short: 'Dom' },
  ];

  readonly HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00

  readonly filteredDays = computed(() => {
    const filter = this.selectedDayFilter();
    return this.DAYS.filter((d) => filter === 'all' || filter === d.day);
  });

  timeToDecimal(timeStr: string): number {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  }

  readonly allEvents = computed<ScheduleEventItem[]>(() => {
    const courses = this.state.courses();
    const timeBlocks = this.state.timeBlocks();

    const classEvents: ScheduleEventItem[] = courses.flatMap((course) =>
      course.timeSlots.map((slot) => ({
        id: `class-${course.id}-${slot.id}`,
        title: course.name,
        code: course.code,
        courseName: course.name,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room || course.classroom,
        color: course.color,
        type: 'class' as const,
        isLocked: true,
        isDeletable: false,
      }))
    );

    const studyEvents: ScheduleEventItem[] = timeBlocks.map((b) => {
      const course = courses.find((c) => c.id === b.courseId);
      return {
        id: b.id,
        title: b.title,
        code: course?.code,
        courseName: course?.name,
        dayOfWeek: b.dayOfWeek,
        startTime: b.startTime,
        endTime: b.endTime,
        room: b.technique || 'Bloque de Estudio',
        technique: b.technique,
        notes: b.notes,
        color: course?.color || '#6366f1',
        type: b.type,
        isAiSuggested: b.isAiSuggested,
        isLocked: false,
        isDeletable: true,
      };
    });

    return [...classEvents, ...studyEvents];
  });

  getEventsForDay(day: number): ScheduleEventItem[] {
    return this.allEvents().filter((ev) => ev.dayOfWeek === day);
  }

  getEventStyles(ev: ScheduleEventItem): { [klass: string]: any } {
    const startDec = this.timeToDecimal(ev.startTime);
    const endDec = this.timeToDecimal(ev.endTime);

    // Exact pixel offset starting from 7:00
    const top = (startDec - 7) * this.ROW_HEIGHT;
    const height = Math.max(32, (endDec - startDec) * this.ROW_HEIGHT - 3);

    // Detect overlapping items in same day column
    const dayEvents = this.getEventsForDay(ev.dayOfWeek);
    const overlapping = dayEvents.filter((other) => {
      if (other.id === ev.id) return false;
      const oStart = this.timeToDecimal(other.startTime);
      const oEnd = this.timeToDecimal(other.endTime);
      return Math.max(startDec, oStart) < Math.min(endDec, oEnd);
    });

    let left = '4px';
    let width = 'calc(100% - 8px)';
    const zIndex = ev.type === 'class' ? 12 : 20;

    if (overlapping.length > 0) {
      const cluster = [ev, ...overlapping].sort((a, b) => a.id.localeCompare(b.id));
      const colIndex = cluster.findIndex((item) => item.id === ev.id);
      const totalCols = cluster.length;
      const colWidthPercent = 100 / totalCols;
      left = `calc(${colIndex * colWidthPercent}% + 2px)`;
      width = `calc(${colWidthPercent}% - 4px)`;
    }

    return {
      top: `${top}px`,
      height: `${height}px`,
      left,
      width,
      zIndex,
      '--event-color': ev.color,
    };
  }

  // Drag and drop handlers
  onDragStart(ev: ScheduleEventItem, event: DragEvent): void {
    if (ev.isLocked) {
      event.preventDefault();
      return;
    }
    this.draggedItem.set(ev);
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', ev.id);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(dayOfWeek: number, hour: number, event: DragEvent): void {
    event.preventDefault();
    const item = this.draggedItem();
    this.draggedItem.set(null);
    if (!item || item.isLocked) return;

    const duration = this.timeToDecimal(item.endTime) - this.timeToDecimal(item.startTime);
    const safeDuration = duration > 0 ? duration : 1.5;

    const startStr = `${hour.toString().padStart(2, '0')}:00`;
    const endDec = hour + safeDuration;
    const endH = Math.floor(endDec);
    const endM = Math.round((endDec - endH) * 60);
    const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    const res = this.state.moveTimeBlock(item.id, dayOfWeek, startStr, endStr);
    if (!res.success) {
      alert(`⚠️ ${res.error || 'No se puede mover aquí por conflicto con clases.'}`);
    } else {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    }
  }

  handleCellClick(dayOfWeek: number, hour: number): void {
    const startStr = `${hour.toString().padStart(2, '0')}:00`;
    const endStr = `${(hour + 1).toString().padStart(2, '0')}:30`;
    const dayName = this.DAYS.find((d) => d.day === dayOfWeek)?.name;

    const title = window.prompt(
      `Nuevo Bloque de Estudio para ${dayName} (${startStr} - ${endStr}):`,
      'Estudio y Repaso Profundo'
    );

    if (title && title.trim()) {
      this.state.addTimeBlock({
        title: title.trim(),
        dayOfWeek,
        startTime: startStr,
        endTime: endStr,
        type: 'study',
        technique: 'Pomodoro 50/10',
        priority: 'alta',
      });
    }
  }

  openBlockDetail(ev: ScheduleEventItem, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedBlockDetail.set(ev);
    this.editDay.set(ev.dayOfWeek);
    this.editStartTime.set(ev.startTime);
    this.editEndTime.set(ev.endTime);
    this.moveError.set(null);
  }

  closeBlockDetail(): void {
    this.selectedBlockDetail.set(null);
    this.moveError.set(null);
  }

  handleSaveBlockMove(): void {
    const current = this.selectedBlockDetail();
    if (!current || current.isLocked) return;

    const res = this.state.moveTimeBlock(
      current.id,
      this.editDay(),
      this.editStartTime(),
      this.editEndTime()
    );

    if (!res.success) {
      this.moveError.set(res.error || 'No se pudo mover el bloque');
    } else {
      this.closeBlockDetail();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    }
  }

  handleAutoBalance(): void {
    const result = this.state.autoBalanceAllBlocks();
    alert(`🤖 Diagnóstico del Agente:\n${result.summary}`);
    if (result.displacedCount > 0) {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
    }
  }

  deleteCurrentBlock(): void {
    const current = this.selectedBlockDetail();
    if (current && current.isDeletable) {
      this.state.deleteTimeBlock(current.id);
      this.closeBlockDetail();
    }
  }

  exportCurrentBlockToGCal(): void {
    const ev = this.selectedBlockDetail();
    if (!ev) return;

    const d = new Date();
    d.setDate(d.getDate() + ((ev.dayOfWeek + 7 - d.getDay()) % 7));
    const [startH, startM] = ev.startTime.split(':').map(Number);
    const [endH, endM] = ev.endTime.split(':').map(Number);

    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startH, startM);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), endH, endM);

    const url = this.calendar.generateGoogleCalendarUrl({
      title: ev.title,
      details: `${ev.courseName || ''} - Técnica: ${ev.technique || 'Time Blocking'}`,
      startDate: start,
      endDate: end,
    });
    window.open(url, '_blank');
  }

  startFocusForCurrentBlock(): void {
    const ev = this.selectedBlockDetail();
    if (!ev) return;

    const task: Task = {
      id: ev.id,
      courseId: 'general',
      title: ev.title,
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'alta',
      status: 'pending',
      estimatedMinutes: 50,
      subtasks: [],
      eisenhowerQuadrant: 'urgente-importante',
      createdAt: new Date().toISOString(),
    };
    this.state.startFocusWithTask(task);
    this.closeBlockDetail();
  }
}

