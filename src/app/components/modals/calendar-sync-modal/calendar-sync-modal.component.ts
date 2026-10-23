import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CronosStateService } from '../../../services/cronos-state.service';
import { CalendarService } from '../../../services/calendar.service';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-calendar-sync-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './calendar-sync-modal.component.html',
})
export class CalendarSyncModalComponent {
  readonly state = inject(CronosStateService);
  readonly calendar = inject(CalendarService);

  close(): void {
    this.state.isCalendarSyncOpen.set(false);
  }

  handleDownloadIcs(): void {
    const courses = this.state.courses();
    const exams = this.state.exams();
    const tasks = this.state.tasks();
    const timeBlocks = this.state.timeBlocks();

    const icsContent = this.calendar.generateICSContent(courses, exams, tasks, timeBlocks);
    this.calendar.downloadICSFile(
      icsContent,
      `cronos-horario-academico-${new Date().toISOString().split('T')[0]}.ics`
    );
  }

  handleExportJson(): void {
    const backupData = {
      courses: this.state.courses(),
      exams: this.state.exams(),
      timeBlocks: this.state.timeBlocks(),
      tasks: this.state.tasks(),
      focusSessions: this.state.focusSessions(),
      exportDate: new Date().toISOString(),
      version: '2.0.0',
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cronos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  handleFileImport(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.courses && parsed.exams && parsed.tasks) {
          this.state.importBackup(parsed);
          alert('¡Copia de seguridad restaurada con éxito!');
          this.close();
        } else {
          alert('El archivo no tiene el formato válido de respaldo de Cronos.');
        }
      } catch {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  }
}
