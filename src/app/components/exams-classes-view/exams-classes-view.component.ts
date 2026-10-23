import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CronosStateService } from '../../services/cronos-state.service';
import { AiService } from '../../services/ai.service';
import { CalendarService } from '../../services/calendar.service';
import { IconComponent } from '../icon/icon.component';
import { Exam, Course, ExamAIBreakdown } from '../../../types';

@Component({
  selector: 'app-exams-classes-view',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './exams-classes-view.component.html',
})
export class ExamsClassesViewComponent {
  readonly state = inject(CronosStateService);
  readonly ai = inject(AiService);
  readonly calendar = inject(CalendarService);

  readonly activeTab = signal<'exams' | 'courses'>('exams');
  readonly expandedExamId = signal<string | null>(null);
  readonly loadingAiExamId = signal<string | null>(null);

  readonly today = new Date();

  getCourseForExam(courseId: string): Course | undefined {
    return this.state.courses().find((c) => c.id === courseId);
  }

  getDaysUntilExam(dateStr: string): string {
    const examDate = new Date(dateStr);
    const diff = Math.ceil((examDate.getTime() - this.today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Concluido';
    if (diff === 0) return '¡HOY!';
    if (diff === 1) return '¡Mañana!';
    return `En ${diff} días`;
  }

  getDayName(dayOfWeek: number): string {
    const names = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return names[dayOfWeek] || '';
  }

  toggleExpandExam(examId: string): void {
    this.expandedExamId.update((curr) => (curr === examId ? null : examId));
  }

  async handleGenerateAiExamPlan(exam: Exam): Promise<void> {
    try {
      this.loadingAiExamId.set(exam.id);
      const course = this.getCourseForExam(exam.courseId);

      const breakdown = await this.ai.breakdownExam({
        examTitle: exam.title,
        courseName: course?.name || 'Académico',
        examDate: exam.date,
        topics: exam.topics,
        difficulty: exam.difficulty,
      });

      this.state.updateExam({
        ...exam,
        aiBreakdown: breakdown,
      });
      this.expandedExamId.set(exam.id);
    } catch (e: any) {
      alert(`No se pudo generar el plan de estudio con IA: ${e.message}`);
    } finally {
      this.loadingAiExamId.set(null);
    }
  }

  handleExportExamToGoogleCal(exam: Exam): void {
    const course = this.getCourseForExam(exam.courseId);
    const [y, m, d] = exam.date.split('-').map(Number);
    const [h, min] = (exam.time || '09:00').split(':').map(Number);

    const start = new Date(y, m - 1, d, h, min);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const url = this.calendar.generateGoogleCalendarUrl({
      title: `📝 EXAMEN: ${exam.title} (${course?.name || ''})`,
      details: `${exam.topics || ''} - Ponderación: ${exam.weightPercentage || 0}%`,
      location: exam.classroom || '',
      startDate: start,
      endDate: end,
    });
    window.open(url, '_blank');
  }
}
