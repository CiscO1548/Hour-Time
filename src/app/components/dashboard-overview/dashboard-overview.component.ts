import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CronosStateService } from '../../services/cronos-state.service';
import { IconComponent } from '../icon/icon.component';
import { Task, StudyMethodType, Course } from '../../../types';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './dashboard-overview.component.html',
})
export class DashboardOverviewComponent {
  readonly state = inject(CronosStateService);

  readonly today = new Date();
  readonly currentDayOfWeek = this.today.getDay();
  readonly todayDateStr = this.today.toISOString().split('T')[0];

  readonly totalStudyMinutes = computed(() => {
    const nowMs = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const recent = this.state.focusSessions().filter(
      (s) => nowMs - new Date(s.timestamp).getTime() <= weekMs
    );
    return recent.reduce((acc, s) => acc + s.durationMinutes, 0);
  });

  readonly totalStudyHours = computed(() => {
    return (this.totalStudyMinutes() / 60).toFixed(1);
  });

  readonly weeklyTargetHours = computed(() => {
    const daily = this.state.preferences().targetDailyHours || 3.5;
    return (daily * 6).toFixed(0);
  });

  readonly progressPercent = computed(() => {
    const target = Number(this.weeklyTargetHours()) * 60;
    if (target === 0) return 0;
    return Math.min(100, Math.round((this.totalStudyMinutes() / target) * 100));
  });

  readonly pendingTasks = computed(() =>
    this.state.tasks().filter((t) => t.status !== 'completed')
  );

  readonly completedTasksCount = computed(() =>
    this.state.tasks().filter((t) => t.status === 'completed').length
  );

  readonly urgentTasks = computed(() =>
    this.pendingTasks().filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const diffDays = (due.getTime() - this.today.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 2 || t.priority === 'alta';
    })
  );

  readonly upcomingExams = computed(() =>
    this.state
      .exams()
      .filter((e) => e.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  readonly nextExam = computed(() => this.upcomingExams()[0]);

  readonly recentSessionsCount = computed(() => {
    const nowMs = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return this.state.focusSessions().filter(
      (s) => nowMs - new Date(s.timestamp).getTime() <= weekMs
    ).length;
  });

  readonly todayAgenda = computed(() => {
    const day = this.currentDayOfWeek;
    const courses = this.state.courses();

    const classes = courses.flatMap((course) =>
      course.timeSlots
        .filter((slot) => slot.dayOfWeek === day)
        .map((slot) => ({
          id: `class-${course.id}-${slot.id}`,
          title: course.name,
          code: course.code,
          room: slot.room || course.classroom,
          startTime: slot.startTime,
          endTime: slot.endTime,
          color: course.color,
          type: 'class' as const,
        }))
    );

    const studyBlocks = this.state
      .timeBlocks()
      .filter((b) => b.dayOfWeek === day)
      .map((b) => {
        const course = courses.find((c) => c.id === b.courseId);
        return {
          id: b.id,
          title: b.title,
          code: course?.code || 'Estudio',
          room: b.technique || 'Time Block',
          startTime: b.startTime,
          endTime: b.endTime,
          color: course?.color || '#6366f1',
          type: b.type,
        };
      });

    return [...classes, ...studyBlocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  getDaysUntilExam(dateStr: string): string {
    const examDate = new Date(dateStr);
    const diff = Math.ceil((examDate.getTime() - this.today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Hoy o en curso';
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    return `En ${diff} días`;
  }

  getCourseForTask(courseId: string): Course | undefined {
    return this.state.courses().find((c) => c.id === courseId);
  }

  getCompletedSubtasksCount(task: Task): number {
    return task.subtasks.filter((s) => s.completed).length;
  }

  handleTaskCheck(taskId: string): void {
    this.state.toggleTaskComplete(taskId);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
    });
  }

  startQuickMethod(title: string, method: StudyMethodType, min: number): void {
    const dummyTask: Task = {
      id: `quick-${method}`,
      courseId: 'general',
      title,
      dueDate: this.todayDateStr,
      priority: 'alta',
      status: 'pending',
      estimatedMinutes: min,
      subtasks: [],
      eisenhowerQuadrant: 'urgente-importante',
      createdAt: new Date().toISOString(),
    };
    this.state.startFocusWithTask(dummyTask, method);
  }

  startFocusForAgendaItem(item: { id: string; title: string }): void {
    const task: Task = {
      id: item.id,
      courseId: 'general',
      title: item.title,
      dueDate: this.todayDateStr,
      priority: 'alta',
      status: 'pending',
      estimatedMinutes: 45,
      subtasks: [],
      eisenhowerQuadrant: 'urgente-importante',
      createdAt: new Date().toISOString(),
    };
    this.state.startFocusWithTask(task);
  }
}
