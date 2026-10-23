import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CronosStateService } from '../../services/cronos-state.service';

@Component({
  selector: 'app-portfolio-export-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio-export-modal.component.html',
})
export class PortfolioExportModalComponent {
  readonly state = inject(CronosStateService);

  readonly totalCredits = computed(() =>
    this.state.courses().reduce((sum, c) => sum + (c.credits || 4), 0)
  );

  readonly totalFocusHours = computed(() => {
    const mins = this.state.focusSessions().reduce((sum, s) => sum + s.durationMinutes, 0);
    return Math.round((mins / 60) * 10) / 10;
  });

  readonly totalCompletedTasks = computed(
    () => this.state.tasks().filter((t) => t.status === 'completed').length
  );

  readonly currentDate = new Date().toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  printReport(): void {
    window.print();
  }

  close(): void {
    this.state.closePortfolioExport();
  }
}
