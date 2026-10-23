import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../../services/cronos-state.service';
import { AiService } from '../../../services/ai.service';
import { IconComponent } from '../../icon/icon.component';
import { AiSchedulePlan, TimeBlock, PriorityLevel } from '../../../../types';
import confetti from 'canvas-confetti';

export interface ProposedBlockItem {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  courseName: string;
  activityTitle: string;
  technique: string;
  priority: string;
  reason: string;
  conflictError: string | null;
}

@Component({
  selector: 'app-ai-optimizer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './ai-optimizer-modal.component.html',
})
export class AiOptimizerModalComponent {
  readonly state = inject(CronosStateService);
  readonly ai = inject(AiService);

  chronotype: 'matutino' | 'vespertino' | 'nocturno' | 'intermedio' =
    this.state.preferences().chronotype || 'intermedio';
  dailyHours: number = this.state.preferences().targetDailyHours || 3;
  preferredMethod: string = 'Pomodoro 50/10';

  readonly isLoading = signal<boolean>(false);
  readonly planResult = signal<AiSchedulePlan | null>(null);
  readonly editableBlocks = signal<ProposedBlockItem[]>([]);

  readonly DAYS_MAP: { [day: number]: string } = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    0: 'Domingo',
  };

  readonly totalConflictsCount = computed(() =>
    this.editableBlocks().filter((b) => !!b.conflictError).length
  );

  close(): void {
    this.state.isAiOptimizerOpen.set(false);
  }

  async handleRunOptimizer(): Promise<void> {
    try {
      this.isLoading.set(true);
      const courses = this.state.courses();
      const exams = this.state.exams();
      const tasks = this.state.tasks();

      const data = await this.ai.optimizeSchedule(courses, exams, tasks, {
        chronotype: this.chronotype,
        targetStudyHoursDaily: this.dailyHours,
        preferredMethod: this.preferredMethod,
      });

      this.planResult.set(data);

      const items: ProposedBlockItem[] = (data.suggestedBlocks || []).map((b) => ({
        dayOfWeek: b.dayOfWeek,
        dayName: this.DAYS_MAP[b.dayOfWeek] || b.dayName || 'Lunes',
        startTime: b.startTime,
        endTime: b.endTime,
        courseName: b.courseName,
        activityTitle: b.activityTitle || `Sesión de ${b.courseName}`,
        technique: b.technique || this.preferredMethod,
        priority: b.priority || 'alta',
        reason: b.reason || 'Optimizado para rendimiento académico.',
        conflictError: null,
      }));

      this.editableBlocks.set(items);
      this.recalculateAllConflicts();

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch (e: any) {
      alert(`No se pudo optimizar el horario: ${e.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  recalculateAllConflicts(): void {
    const blocks = [...this.editableBlocks()];
    const parseMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    blocks.forEach((block, index) => {
      block.dayName = this.DAYS_MAP[block.dayOfWeek] || 'Lunes';
      const bStart = parseMins(block.startTime);
      const bEnd = parseMins(block.endTime);

      if (bStart >= bEnd) {
        block.conflictError = 'La hora de inicio debe ser anterior a la hora de fin.';
        return;
      }

      // Check slot with university classes & existing user custom blocks
      const slotCheck = this.state.checkSlotConflict(block.dayOfWeek, block.startTime, block.endTime);
      if (slotCheck.hasConflict) {
        block.conflictError = slotCheck.reason || 'Horario ocupado en ese día.';
        return;
      }

      // Check conflict with other proposed blocks in this same plan
      let foundSiblingConflict = false;
      for (let j = 0; j < blocks.length; j++) {
        if (index === j) continue;
        const other = blocks[j];
        if (other.dayOfWeek === block.dayOfWeek) {
          const oStart = parseMins(other.startTime);
          const oEnd = parseMins(other.endTime);
          if (Math.max(bStart, oStart) < Math.min(bEnd, oEnd)) {
            block.conflictError = `Coincide con otra sesión propuesta del plan: "${other.activityTitle}" (${other.startTime} - ${other.endTime})`;
            foundSiblingConflict = true;
            break;
          }
        }
      }

      if (!foundSiblingConflict) {
        block.conflictError = null;
      }
    });

    this.editableBlocks.set(blocks);
  }

  onBlockChange(index: number): void {
    this.recalculateAllConflicts();
  }

  autoFindFreeSlotForBlock(index: number): void {
    const blocks = [...this.editableBlocks()];
    const block = blocks[index];
    if (!block) return;

    const parseMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const decToTime = (dec: number) => {
      const h = Math.floor(dec);
      const m = Math.round((dec - h) * 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const durationMins = parseMins(block.endTime) - parseMins(block.startTime);
    const durationHours = durationMins > 0 ? durationMins / 60 : 1.5;

    // Search across candidate hours and days (starting with current day)
    const daysToTry = [block.dayOfWeek, 1, 2, 3, 4, 5, 6];
    const candidateStarts = [14.0, 16.0, 18.0, 19.5, 8.0, 10.0, 11.5];

    for (const d of daysToTry) {
      for (const startDec of candidateStarts) {
        const startStr = decToTime(startDec);
        const endStr = decToTime(startDec + durationHours);

        // Check if clean against state
        const stateCheck = this.state.checkSlotConflict(d, startStr, endStr);
        if (!stateCheck.hasConflict) {
          // Check if clean against other proposed blocks
          const sMins = parseMins(startStr);
          const eMins = parseMins(endStr);
          const siblingConflict = blocks.some((other, j) => {
            if (j === index) return false;
            if (other.dayOfWeek !== d) return false;
            const oStart = parseMins(other.startTime);
            const oEnd = parseMins(other.endTime);
            return Math.max(sMins, oStart) < Math.min(eMins, oEnd);
          });

          if (!siblingConflict) {
            block.dayOfWeek = d;
            block.dayName = this.DAYS_MAP[d];
            block.startTime = startStr;
            block.endTime = endStr;
            block.conflictError = null;
            this.recalculateAllConflicts();
            return;
          }
        }
      }
    }
  }

  autoResolveAllConflicts(): void {
    const blocks = this.editableBlocks();
    blocks.forEach((_, idx) => {
      if (this.editableBlocks()[idx].conflictError) {
        this.autoFindFreeSlotForBlock(idx);
      }
    });
    this.recalculateAllConflicts();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
  }

  handleApplyToSchedule(): void {
    this.recalculateAllConflicts();
    if (this.totalConflictsCount() > 0) {
      alert('⚠️ No se puede aplicar el plan porque aún existen choques de horario. Por favor reubica los bloques en rojo o usa "Auto-Resolver Choques".');
      return;
    }

    const courses = this.state.courses();
    const newBlocks: Omit<TimeBlock, 'id'>[] = this.editableBlocks().map((b) => {
      const course = courses.find((c) =>
        c.name.toLowerCase().includes(b.courseName.toLowerCase())
      );
      return {
        title: b.activityTitle || `Estudio: ${b.courseName}`,
        courseId: course?.id,
        dayOfWeek: b.dayOfWeek,
        startTime: b.startTime,
        endTime: b.endTime,
        type: 'study',
        technique: b.technique || this.preferredMethod,
        priority: (b.priority === 'baja' || b.priority === 'media' ? b.priority : 'alta') as PriorityLevel,
        notes: b.reason,
        isAiSuggested: true,
      };
    });

    this.state.applySuggestedBlocks(newBlocks, true);
    this.close();
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.7 } });
  }

  resetPlan(): void {
    this.planResult.set(null);
    this.editableBlocks.set([]);
  }
}

