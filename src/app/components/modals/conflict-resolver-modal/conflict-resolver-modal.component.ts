import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../../services/cronos-state.service';
import { AiService } from '../../../services/ai.service';
import { IconComponent } from '../../icon/icon.component';
import { ConflictResolutionResult } from '../../../../types';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-conflict-resolver-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './conflict-resolver-modal.component.html',
})
export class ConflictResolverModalComponent implements OnInit {
  readonly state = inject(CronosStateService);
  readonly ai = inject(AiService);

  eventType: 'rescheduled_class' | 'work_emergency' | 'urgent_task' | 'audit' = 'rescheduled_class';
  eventTitle = 'Clase de Cálculo Multivariable (Reprogramada)';
  eventDay = 2; // Martes
  eventStartTime = '16:00';
  eventEndTime = '18:00';
  eventNotes = 'El profesor movió la clase de la mañana a la tarde.';

  readonly isLoading = signal<boolean>(false);
  readonly resolutionResult = signal<ConflictResolutionResult | null>(null);

  ngOnInit(): void {
    // If there are existing overlaps detected, default to audit mode
    if (this.state.detectedConflictsCount() > 0) {
      this.eventType = 'audit';
    }
  }

  close(): void {
    this.state.isConflictResolverOpen.set(false);
  }

  applyPreset(preset: 'class' | 'work' | 'audit'): void {
    if (preset === 'class') {
      this.eventType = 'rescheduled_class';
      this.eventTitle = 'Clase de Cálculo Multivariable (Reprogramada)';
      this.eventDay = 2;
      this.eventStartTime = '16:00';
      this.eventEndTime = '18:00';
      this.eventNotes = 'El profesor cambió el horario de clase.';
    } else if (preset === 'work') {
      this.eventType = 'work_emergency';
      this.eventTitle = 'Turno Extra / Tarea Urgente de Trabajo';
      this.eventDay = 3;
      this.eventStartTime = '17:00';
      this.eventEndTime = '19:30';
      this.eventNotes = 'Reunión o entrega laboral no programada.';
    } else {
      this.eventType = 'audit';
    }
    this.resolutionResult.set(null);
  }

  async handleResolveConflicts(): Promise<void> {
    try {
      this.isLoading.set(true);
      const courses = this.state.courses();
      const timeBlocks = this.state.timeBlocks();
      const exams = this.state.exams();
      const preferences = this.state.preferences();

      const incomingEvent =
        this.eventType === 'audit'
          ? undefined
          : {
              type: this.eventType,
              title: this.eventTitle.trim() || 'Compromiso Imprevisto',
              dayOfWeek: Number(this.eventDay),
              startTime: this.eventStartTime,
              endTime: this.eventEndTime,
              notes: this.eventNotes,
            };

      const result = await this.ai.resolveScheduleConflicts({
        incomingEvent,
        courses,
        timeBlocks,
        exams,
        studentPreferences: preferences,
      });

      this.resolutionResult.set(result);
      if (result.conflictsDetected.length > 0) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }
    } catch (e: any) {
      alert(`No se pudo resolver el conflicto: ${e.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  handleApplyRebalance(): void {
    const res = this.resolutionResult();
    if (!res || !res.updatedTimeBlocks) return;

    this.state.applyResolvedSchedule(res.updatedTimeBlocks);
    this.close();
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.7 } });
  }

  reset(): void {
    this.resolutionResult.set(null);
  }
}
