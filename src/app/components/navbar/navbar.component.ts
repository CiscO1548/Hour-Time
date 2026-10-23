import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CronosStateService } from '../../services/cronos-state.service';
import { IconComponent } from '../icon/icon.component';
import { TabType } from '../../../types';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  readonly state = inject(CronosStateService);
  readonly showNotifications = signal<boolean>(false);

  readonly currentDateFormatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  get unreadCount(): number {
    return this.state.notifications().filter((n) => !n.read).length;
  }

  formatTimerDisplay(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  toggleNotifications(): void {
    this.showNotifications.update((v) => !v);
  }

  formatTime(isoString: string): string {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  navigateToTab(tab: TabType): void {
    this.state.setTab(tab);
  }
}
