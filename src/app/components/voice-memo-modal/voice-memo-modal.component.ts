import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../services/cronos-state.service';
import { AudioService } from '../../services/audio.service';
import { IconComponent } from '../icon/icon.component';
import { VoiceMemoNote } from '../../../types';

@Component({
  selector: 'app-voice-memo-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './voice-memo-modal.component.html',
})
export class VoiceMemoModalComponent implements OnDestroy {
  readonly state = inject(CronosStateService);
  readonly audio = inject(AudioService);

  readonly selectedCourseId = signal<string>(this.state.courses()[0]?.id || 'c1');
  readonly isRecording = signal<boolean>(false);
  readonly recordingDuration = signal<number>(0);
  readonly isProcessing = signal<boolean>(false);

  readonly activeMemo = signal<VoiceMemoNote | null>(
    this.state.voiceMemos()[0] || null
  );

  private recordTimer: any = null;

  readonly timeFormatted = computed(() => {
    const s = this.recordingDuration();
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  ngOnDestroy(): void {
    this.stopRecordingTimer();
  }

  private stopRecordingTimer(): void {
    if (this.recordTimer) {
      clearInterval(this.recordTimer);
      this.recordTimer = null;
    }
  }

  toggleRecording(): void {
    if (!this.isRecording()) {
      this.isRecording.set(true);
      this.recordingDuration.set(0);
      if (this.state.preferences().soundEnabled) {
        this.audio.playTick();
      }

      this.stopRecordingTimer();
      this.recordTimer = setInterval(() => {
        this.recordingDuration.update((d) => d + 1);
      }, 1000);
    } else {
      this.isRecording.set(false);
      this.stopRecordingTimer();
      this.processAudioRecording();
    }
  }

  private processAudioRecording(): void {
    this.isProcessing.set(true);
    const course = this.state.courses().find((c) => c.id === this.selectedCourseId()) || this.state.courses()[0];

    setTimeout(() => {
      const newMemo: VoiceMemoNote = {
        id: `vm-${Date.now()}`,
        courseId: course.id,
        courseName: course.name,
        title: `Nota de Voz: Clase de ${course.name}`,
        durationSeconds: this.recordingDuration() || 45,
        recordedAt: new Date().toISOString(),
        transcription: `En la sesión de hoy sobre ${course.name}, se explicó la resolución de problemas prácticos, destacando los criterios de convergencia y la aplicación de fórmulas clave para el examen parcial.`,
        summaryBulletPoints: [
          `Repaso intensivo de los temas troncales de ${course.code}.`,
          'El docente enfatizó prestar atención al planteamiento analítico antes de operar.',
          'Posible pregunta de desarrollo con ponderación del 30% en el examen.',
        ],
        formulasDetected: [
          'Δf = f(x + Δx) - f(x)',
          'E = mc²',
        ],
        actionItems: [
          `Completar la guía de ejercicios de ${course.name} antes del viernes.`,
        ],
        convertedToFlashcards: false,
      };

      this.state.addVoiceMemo(newMemo);
      this.activeMemo.set(newMemo);
      this.isProcessing.set(false);
      if (this.state.preferences().soundEnabled) {
        this.audio.playCompletionChime();
      }
    }, 1100);
  }

  convertToFlashcards(memo: VoiceMemoNote): void {
    this.state.openFlashcards(memo.courseName, memo.title);
    this.state.awardXp(80, `Flashcards creadas a partir de la nota de voz "${memo.title}"`);
    this.state.closeVoiceMemo();
  }

  createTaskFromMemo(memo: VoiceMemoNote): void {
    const action = memo.actionItems[0] || `Repasar nota de voz: ${memo.title}`;
    this.state.tasks.update((prev) => [
      {
        id: `task-vm-${Date.now()}`,
        courseId: memo.courseId,
        title: action,
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'alta',
        eisenhowerQuadrant: 'urgente-importante',
        status: 'pending',
        estimatedMinutes: 45,
        subtasks: [],
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    this.state.addNotification({
      id: `notif-vm-${Date.now()}`,
      title: '✓ Tarea Creada desde Nota de Voz',
      message: `Se añadió "${action}" a tu lista de tareas pendientes.`,
      type: 'task',
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  close(): void {
    this.stopRecordingTimer();
    this.state.closeVoiceMemo();
  }
}
