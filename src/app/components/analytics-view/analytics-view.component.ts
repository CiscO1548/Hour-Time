import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CronosStateService } from '../../services/cronos-state.service';
import { AiService } from '../../services/ai.service';
import { IconComponent } from '../icon/icon.component';
import { AiCoachDiagnostic } from '../../../types';

@Component({
  selector: 'app-analytics-view',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './analytics-view.component.html',
})
export class AnalyticsViewComponent {
  readonly state = inject(CronosStateService);
  readonly ai = inject(AiService);

  readonly aiCoachReport = signal<AiCoachDiagnostic | null>(null);
  readonly isLoadingCoach = signal<boolean>(false);

  readonly daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  readonly weekDaysOrdered = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  readonly dailyMinutes = computed(() => {
    const map: Record<string, number> = {
      Lun: 0,
      Mar: 0,
      Mié: 0,
      Jue: 0,
      Vie: 0,
      Sáb: 0,
      Dom: 0,
    };

    this.state.focusSessions().forEach((s) => {
      const d = new Date(s.timestamp);
      const dayName = this.daysOfWeek[d.getDay()];
      if (map[dayName] !== undefined) {
        map[dayName] += s.durationMinutes;
      }
    });

    return map;
  });

  readonly totalMinutes = computed(() => {
    return this.state
      .focusSessions()
      .reduce((acc, s) => acc + s.durationMinutes, 0);
  });

  readonly totalHours = computed(() => {
    return (this.totalMinutes() / 60).toFixed(1);
  });

  readonly subjectBreakdown = computed(() => {
    const courseTimeMap: Record<string, number> = {};
    const courses = this.state.courses();
    const totalMins = this.totalMinutes();

    this.state.focusSessions().forEach((s) => {
      const cId = s.courseId || 'general';
      courseTimeMap[cId] = (courseTimeMap[cId] || 0) + s.durationMinutes;
    });

    return Object.entries(courseTimeMap).map(([courseId, mins]) => {
      const course = courses.find((c) => c.id === courseId);
      const percentage = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0;
      return {
        courseId,
        name: course?.name || 'General / Varios',
        code: course?.code || 'GEN',
        color: course?.color || '#6366f1',
        minutes: mins,
        hours: (mins / 60).toFixed(1),
        percentage,
      };
    });
  });

  readonly completedTasksCount = computed(() => {
    return this.state.tasks().filter((t) => t.status === 'completed').length;
  });

  readonly completionRate = computed(() => {
    const all = this.state.tasks().length;
    if (all === 0) return 100;
    return Math.round((this.completedTasksCount() / all) * 100);
  });

  readonly productivityScore = computed(() => {
    const targetDaily = this.state.preferences().targetDailyHours || 3.5;
    const targetWeekMinutes = targetDaily * 6 * 60;
    const streak = this.state.preferences().studyStreakDays || 0;

    const hoursScore = Math.min(50, Math.round((this.totalMinutes() / targetWeekMinutes) * 50));
    const taskScore = Math.min(30, Math.round((this.completionRate() / 100) * 30));
    const streakScore = Math.min(20, streak * 4);

    return Math.min(100, hoursScore + taskScore + streakScore);
  });

  readonly maxDayMinutes = computed(() => {
    const mins = Object.values(this.dailyMinutes());
    const targetDaily = (this.state.preferences().targetDailyHours || 3.5) * 60;
    return Math.max(...mins, targetDaily, 60);
  });

  getDayMinutes(day: string): number {
    return this.dailyMinutes()[day] || 0;
  }

  getDayHeightPercent(day: string): number {
    const mins = this.getDayMinutes(day);
    const max = this.maxDayMinutes();
    if (max === 0) return 8;
    return Math.max(8, Math.min(100, Math.round((mins / max) * 100)));
  }

  getDayHours(day: string): string {
    return (this.getDayMinutes(day) / 60).toFixed(1);
  }

  async handleGenerateCoachReport(): Promise<void> {
    try {
      this.isLoadingCoach.set(true);
      const pendingCount = this.state.pendingTasksCount();
      const upcomingExamsCount = this.state.upcomingExamsCount();

      const data = await this.ai.getAcademicCoachDiagnostic(
        {
          totalStudyHours: this.totalHours(),
          completedTasks: this.completedTasksCount(),
          totalTasks: this.state.tasks().length,
          focusSessionsCount: this.state.focusSessions().length,
          streakDays: this.state.preferences().studyStreakDays || 0,
        },
        this.state.courses().map((c) => ({ name: c.name, code: c.code })),
        pendingCount,
        upcomingExamsCount
      );

      this.aiCoachReport.set(data);
    } catch (e: any) {
      alert(`No se pudo generar el diagnóstico con IA: ${e.message}`);
    } finally {
      this.isLoadingCoach.set(false);
    }
  }

  closeReport(): void {
    this.aiCoachReport.set(null);
  }
}
