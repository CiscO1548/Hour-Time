import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../../services/cronos-state.service';
import { AudioService } from '../../../services/audio.service';
import { IconComponent } from '../../icon/icon.component';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-imminent-deadline-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './imminent-deadline-modal.component.html',
})
export class ImminentDeadlineModalComponent implements OnInit {
  readonly state = inject(CronosStateService);
  readonly audio = inject(AudioService);

  showPostponeOptions = signal<boolean>(false);
  selectedPostponeHours = signal<number>(2);
  customDate = '';
  customTime = '';
  isCustom = signal<boolean>(false);
  rebalanceResult = signal<{ success: boolean; message: string; relocatedCount: number; newSlot: string } | null>(null);

  ngOnInit(): void {
    if (this.state.preferences().soundEnabled) {
      this.audio.playBreakChime();
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.customDate = tomorrow.toISOString().split('T')[0];
    this.customTime = '18:00';
  }

  close(): void {
    this.state.closeImminentAlert();
  }

  handleStartFocus(): void {
    const alertItem = this.state.imminentAlert();
    if (!alertItem) return;

    const task = this.state.tasks().find((t) => t.id === alertItem.targetTaskId);
    if (task) {
      this.state.startFocusWithTask(task);
    } else {
      this.state.setTab('pomodoro');
    }
    this.close();
  }

  handleCompleteTask(): void {
    const alertItem = this.state.imminentAlert();
    if (alertItem && alertItem.targetTaskId) {
      this.state.toggleTaskComplete(alertItem.targetTaskId);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    }
    this.close();
  }

  handleSelectPostpone(hours: number): void {
    this.isCustom.set(false);
    this.selectedPostponeHours.set(hours);
  }

  handleExecutePostpone(): void {
    const alertItem = this.state.imminentAlert();
    let targetTaskId = alertItem?.targetTaskId;

    if (!targetTaskId) {
      const fallbackTask = this.state.tasks().find((t) => t.status !== 'completed');
      if (fallbackTask) {
        targetTaskId = fallbackTask.id;
      } else {
        alert('No hay tarea pendiente para aplazar.');
        this.close();
        return;
      }
    }

    const res = this.state.postponeAndRebalanceTask(
      targetTaskId,
      this.selectedPostponeHours(),
      this.isCustom() ? this.customDate : undefined,
      this.isCustom() ? this.customTime : undefined
    );

    this.rebalanceResult.set(res);
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });

    setTimeout(() => {
      this.close();
    }, 2800);
  }
}
