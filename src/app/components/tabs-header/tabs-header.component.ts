import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CronosStateService } from '../../services/cronos-state.service';
import { IconComponent } from '../icon/icon.component';
import { TabType } from '../../../types';

interface TabItem {
  id: TabType;
  label: string;
  icon: string;
  badge?: string;
  countKey?: 'pendingTasks' | 'upcomingExams';
}

@Component({
  selector: 'app-tabs-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './tabs-header.component.html',
})
export class TabsHeaderComponent {
  readonly state = inject(CronosStateService);

  readonly tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Panel General',
      icon: 'layout-dashboard',
    },
    {
      id: 'schedule',
      label: 'Horario & Time Blocking',
      icon: 'calendar-days',
      badge: 'Semanal',
    },
    {
      id: 'tasks',
      label: 'Tareas & Entregas',
      icon: 'check-square',
      countKey: 'pendingTasks',
    },
    {
      id: 'exams',
      label: 'Clases & Exámenes',
      icon: 'graduation-cap',
      countKey: 'upcomingExams',
    },
    {
      id: 'pomodoro',
      label: 'Modo Foco & Pomodoro',
      icon: 'timer',
      badge: 'Enfoque',
    },
    {
      id: 'analytics',
      label: 'Analíticas & IA',
      icon: 'bar-chart-3',
      badge: 'Coach',
    },
  ];

  getTabCount(tab: TabItem): number | undefined {
    if (tab.countKey === 'pendingTasks') {
      return this.state.pendingTasksCount();
    }
    if (tab.countKey === 'upcomingExams') {
      return this.state.upcomingExamsCount();
    }
    return undefined;
  }
}
