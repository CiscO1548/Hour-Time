import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../services/cronos-state.service';
import { AiService } from '../../services/ai.service';
import { IconComponent } from '../icon/icon.component';
import { Task, EisenhowerQuadrant, Course } from '../../../types';
import confetti from 'canvas-confetti';

interface EisenhowerQuadDef {
  id: EisenhowerQuadrant;
  title: string;
  subtitle: string;
  border: string;
  badgeBg: string;
}

@Component({
  selector: 'app-tasks-view',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './tasks-view.component.html',
})
export class TasksViewComponent {
  readonly state = inject(CronosStateService);
  readonly ai = inject(AiService);

  readonly viewMode = signal<'list' | 'eisenhower'>('list');
  readonly searchQuery = signal<string>('');
  readonly filterCourse = signal<string>('all');
  readonly filterPriority = signal<string>('all');
  readonly filterStatus = signal<string>('all');
  readonly expandedTaskId = signal<string | null>(null);
  readonly isAiBreakingDown = signal<string | null>(null);

  readonly eisenhowerQuadrants: EisenhowerQuadDef[] = [
    {
      id: 'urgente-importante',
      title: 'Hacer Ya (Urgente e Importante)',
      subtitle: 'Exámenes inminentes, tareas con fecha límite próxima',
      border: 'border-rose-200 dark:border-rose-900/60',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    },
    {
      id: 'no-urgente-importante',
      title: 'Planificar & Foco (No Urgente pero Importante)',
      subtitle: 'Proyectos a largo plazo, estudio espaciado, lecturas',
      border: 'border-blue-200 dark:border-blue-900/60',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'urgente-no-importante',
      title: 'Optimizar / Rápido (Urgente pero No Importante)',
      subtitle: 'Trámites administrativos, respuestas a correos breves',
      border: 'border-amber-200 dark:border-amber-900/60',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    {
      id: 'no-urgente-no-importante',
      title: 'Minimizar (No Urgente ni Importante)',
      subtitle: 'Tareas secundarias o postergables',
      border: 'border-slate-200 dark:border-slate-800',
      badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    },
  ];

  readonly filteredTasks = computed(() => {
    const tasks = this.state.tasks();
    const query = this.searchQuery().toLowerCase();
    const course = this.filterCourse();
    const priority = this.filterPriority();
    const status = this.filterStatus();

    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query));
      const matchesCourse = course === 'all' || task.courseId === course;
      const matchesPriority = priority === 'all' || task.priority === priority;
      const matchesStatus =
        status === 'all'
          ? true
          : status === 'pending'
          ? task.status !== 'completed'
          : task.status === 'completed';

      return matchesSearch && matchesCourse && matchesPriority && matchesStatus;
    });
  });

  getTasksForQuadrant(quadId: EisenhowerQuadrant): Task[] {
    return this.filteredTasks().filter(
      (t) => (t.eisenhowerQuadrant || 'urgente-importante') === quadId
    );
  }

  getCourseForTask(courseId: string): Course | undefined {
    return this.state.courses().find((c) => c.id === courseId);
  }

  getCompletedSubtasksCount(task: Task): number {
    return task.subtasks.filter((s) => s.completed).length;
  }

  handleTaskComplete(taskId: string): void {
    this.state.toggleTaskComplete(taskId);
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.8 },
    });
  }

  toggleExpandTask(taskId: string): void {
    this.expandedTaskId.update((curr) => (curr === taskId ? null : taskId));
  }

  async handleAiBreakdownTask(task: Task): Promise<void> {
    try {
      this.isAiBreakingDown.set(task.id);
      const courseList = this.state.courses().map((c) => c.name);

      const data = await this.ai.breakdownTask(
        `${task.title} - ${task.description || ''}`,
        courseList
      );

      if (data && data.subtasks && Array.isArray(data.subtasks)) {
        const newSubtasks = data.subtasks.map((step: string, idx: number) => ({
          id: `ai-st-${Date.now()}-${idx}`,
          title: step,
          completed: false,
        }));

        this.state.updateTask({
          ...task,
          estimatedMinutes: data.estimatedMinutes || task.estimatedMinutes,
          eisenhowerQuadrant: data.eisenhowerQuadrant || task.eisenhowerQuadrant,
          productivityTip: data.productivityTip || task.productivityTip,
          subtasks: [...task.subtasks, ...newSubtasks],
        });

        this.expandedTaskId.set(task.id);
      }
    } catch (e: any) {
      alert(`No se pudo desglosar la tarea: ${e.message}`);
    } finally {
      this.isAiBreakingDown.set(null);
    }
  }
}
