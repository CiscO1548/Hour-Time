import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CronosStateService } from '../../services/cronos-state.service';
import { AudioService } from '../../services/audio.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-floating-pomodoro-widget',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './floating-pomodoro-widget.component.html',
})
export class FloatingPomodoroWidgetComponent {
  readonly state = inject(CronosStateService);
  readonly audio = inject(AudioService);

  readonly isCollapsed = signal<boolean>(false);

  readonly isRunning = computed(() => this.state.activeTimerState().isRunning);
  readonly timeLeft = computed(() => this.state.activeTimerState().timeLeft);
  readonly mode = computed(() => this.state.activeTimerState().mode);
  readonly taskTitle = computed(() => this.state.activeTimerState().taskTitle || 'Sesión de Foco Activa');

  readonly timeFormatted = computed(() => {
    const total = this.timeLeft();
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  toggleCollapse(): void {
    this.isCollapsed.update((c) => !c);
  }

  goToPomodoroTab(): void {
    this.state.setTab('pomodoro');
  }

  togglePlay(): void {
    if (this.state.preferences().soundEnabled) {
      this.audio.playTick();
    }
    const current = this.state.activeTimerState();
    this.state.updateActiveTimer({
      ...current,
      isRunning: !current.isRunning,
    });
  }

  close(): void {
    this.state.toggleFloatingWidget(false);
  }
}
