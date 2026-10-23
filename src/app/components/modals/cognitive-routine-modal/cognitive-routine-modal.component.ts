import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CronosStateService } from '../../../services/cronos-state.service';
import { AiService } from '../../../services/ai.service';
import { IconComponent } from '../../icon/icon.component';
import { CognitiveAdaptationResult } from '../../../../types';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-cognitive-routine-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './cognitive-routine-modal.component.html',
})
export class CognitiveRoutineModalComponent implements OnInit {
  readonly state = inject(CronosStateService);
  readonly ai = inject(AiService);

  readonly isLoading = signal<boolean>(false);
  readonly adaptationResult = signal<CognitiveAdaptationResult | null>(null);

  ngOnInit(): void {
    this.handleRunCognitiveAnalysis();
  }

  close(): void {
    this.state.isCognitiveAdaptationOpen.set(false);
  }

  async handleRunCognitiveAnalysis(): Promise<void> {
    try {
      this.isLoading.set(true);
      const courses = this.state.courses();
      const timeBlocks = this.state.timeBlocks();
      const focusSessions = this.state.focusSessions();
      const studentPreferences = this.state.preferences();

      const result = await this.ai.adaptCognitiveRoutines({
        courses,
        timeBlocks,
        focusSessions,
        studentPreferences,
      });

      this.adaptationResult.set(result);
    } catch (e: any) {
      alert(`Error al analizar adaptación cognitiva: ${e.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  handleApplyAdaptedRoutine(): void {
    const res = this.adaptationResult();
    if (!res || !res.updatedTimeBlocks) return;

    this.state.applyCognitiveRoutine(res.updatedTimeBlocks);
    this.close();
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.65 } });
  }
}
