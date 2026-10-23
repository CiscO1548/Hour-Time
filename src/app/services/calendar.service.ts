import { Injectable } from '@angular/core';
import { Course, Exam, Task, TimeBlock } from '../../types';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private formatDateToICS(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  generateGoogleCalendarUrl(event: {
    title: string;
    details?: string;
    location?: string;
    startDate: Date;
    endDate: Date;
  }): string {
    const formatGCalDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const text = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.details || '');
    const location = encodeURIComponent(event.location || '');
    const dates = `${formatGCalDate(event.startDate)}/${formatGCalDate(event.endDate)}`;

    return `${baseUrl}&text=${text}&details=${details}&location=${location}&dates=${dates}`;
  }

  generateICSContent(
    courses: Course[],
    exams: Exam[],
    tasks: Task[],
    timeBlocks: TimeBlock[]
  ): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Cronos Academic Planner//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Horario y Entregas Académicas',
      'X-WR-TIMEZONE:UTC',
    ];

    const now = new Date();
    const dtStamp = this.formatDateToICS(now);

    // 1. Export Exams
    exams.forEach((exam) => {
      const course = courses.find((c) => c.id === exam.courseId);
      const examDateStr = exam.date;
      const timeStr = exam.time || '09:00';
      const [year, month, day] = examDateStr.split('-').map(Number);
      const [hour, min] = timeStr.split(':').map(Number);

      const startDate = new Date(year, month - 1, day, hour, min);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:exam-${exam.id}@cronos.academic`);
      lines.push(`DTSTAMP:${dtStamp}`);
      lines.push(`DTSTART:${this.formatDateToICS(startDate)}`);
      lines.push(`DTEND:${this.formatDateToICS(endDate)}`);
      lines.push(`SUMMARY:📝 EXAMEN: ${exam.title} (${course?.name || 'Académico'})`);
      lines.push(
        `DESCRIPTION:${(exam.topics || 'Temas del examen').replace(/\n/g, '\\n')} - Ponderación: ${exam.weightPercentage || 0}%`
      );
      if (exam.classroom) {
        lines.push(`LOCATION:${exam.classroom}`);
      }
      lines.push('STATUS:CONFIRMED');
      lines.push('BEGIN:VALARM');
      lines.push('TRIGGER:-P1D');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:Recordatorio: Examen mañana de ${course?.name || exam.title}`);
      lines.push('END:VALARM');
      lines.push('END:VEVENT');
    });

    // 2. Export Tasks / Assignments
    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const course = courses.find((c) => c.id === task.courseId);
      const [year, month, day] = task.dueDate.split('-').map(Number);
      const timeStr = task.dueTime || '23:59';
      const [hour, min] = timeStr.split(':').map(Number);

      const endDate = new Date(year, month - 1, day, hour, min);
      const startDate = new Date(endDate.getTime() - (task.estimatedMinutes || 60) * 60 * 1000);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:task-${task.id}@cronos.academic`);
      lines.push(`DTSTAMP:${dtStamp}`);
      lines.push(`DTSTART:${this.formatDateToICS(startDate)}`);
      lines.push(`DTEND:${this.formatDateToICS(endDate)}`);
      lines.push(`SUMMARY:⏳ ENTREGA: ${task.title} (${course?.name || 'General'})`);
      lines.push(
        `DESCRIPTION:Prioridad: ${task.priority.toUpperCase()}\\n${(task.description || '').replace(/\n/g, '\\n')}`
      );
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });

    // 3. Export Recurring Class Schedules
    courses.forEach((course) => {
      course.timeSlots.forEach((slot) => {
        for (let week = 0; week < 4; week++) {
          const d = new Date();
          d.setDate(d.getDate() + ((slot.dayOfWeek + 7 - d.getDay()) % 7) + week * 7);

          const [startH, startM] = slot.startTime.split(':').map(Number);
          const [endH, endM] = slot.endTime.split(':').map(Number);

          const startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startH, startM);
          const endDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), endH, endM);

          lines.push('BEGIN:VEVENT');
          lines.push(`UID:class-${course.id}-${slot.id}-w${week}@cronos.academic`);
          lines.push(`DTSTAMP:${dtStamp}`);
          lines.push(`DTSTART:${this.formatDateToICS(startDate)}`);
          lines.push(`DTEND:${this.formatDateToICS(endDate)}`);
          lines.push(`SUMMARY:🎓 CLASE: ${course.name} (${course.code})`);
          lines.push(`DESCRIPTION:Profesor: ${course.professor || 'No especificado'}`);
          if (slot.room || course.classroom) {
            lines.push(`LOCATION:${slot.room || course.classroom}`);
          }
          lines.push('STATUS:CONFIRMED');
          lines.push('END:VEVENT');
        }
      });
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  downloadICSFile(icsContent: string, filename = 'mi_horario_academico.ics'): void {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
