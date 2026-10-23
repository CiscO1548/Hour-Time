import {
  Component,
  inject,
  signal,
  computed,
  effect,
  OnDestroy,
  OnInit,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../services/cronos-state.service';
import { AudioService } from '../../services/audio.service';
import { IconComponent } from '../icon/icon.component';
import { StudyMethodType, Task, FocusSession } from '../../../types';
import confetti from 'canvas-confetti';

interface MethodPreset {
  id: StudyMethodType;
  name: string;
  workMin: number;
  breakMin: number;
  desc: string;
}

@Component({
  selector: 'app-pomodoro-timer',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './pomodoro-timer.component.html',
})
export class PomodoroTimerComponent implements OnInit, OnDestroy {
  readonly state = inject(CronosStateService);
  readonly audio = inject(AudioService);
  readonly Math = Math;

  readonly method = signal<StudyMethodType>('pomodoro_25_5');
  readonly workDurationMinutes = signal<number>(25);
  readonly breakDurationMinutes = signal<number>(5);
  readonly timeLeft = signal<number>(25 * 60);
  readonly isRunning = signal<boolean>(false);
  readonly mode = signal<'work' | 'break'>('work');
  readonly selectedTaskId = signal<string>('');
  readonly ambientSound = signal<'off' | 'rain' | 'whitenoise' | 'waves'>('off');
  readonly ambientVolume = signal<number>(0.3);
  readonly completedCycles = signal<number>(0);

  // Completion modal state
  readonly showCompletionModal = signal<boolean>(false);
  readonly energyRating = signal<1 | 2 | 3 | 4 | 5>(4);
  sessionNotes = '';

  // Zen Mode (Full Screen Immersive Focus)
  readonly isZenMode = this.state.isZenMode;
  readonly zenTheme = signal<'library' | 'rain' | 'lofi' | 'space'>('library');
  readonly zenQuotes = [
    'El foco profundo sostenido durante 25 minutos genera el 80% de la retención a largo plazo.',
    'La atención es el músculo supremo de la ingeniería y el aprendizaje acelerado.',
    'Una sola tarea a la vez con intensidad total supera a 5 horas de distracción.',
    'El descanso activo sincroniza tus redes neuronales y fija lo aprendido.',
    'Cada bloque completado te acerca un paso más a tu título y excelencia profesional.',
  ];
  readonly quoteIndex = signal<number>(0);
  readonly currentQuote = computed(() => this.zenQuotes[this.quoteIndex() % this.zenQuotes.length]);

  // Particle collections for animated Zen themes
  readonly raindrops = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    duration: 0.6 + Math.random() * 0.7,
    delay: Math.random() * 2,
    height: 18 + Math.random() * 30,
    opacity: 0.35 + Math.random() * 0.55,
  }));

  readonly stars = Array.from({ length: 65 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1.5 + Math.random() * 2.5,
    duration: 1.5 + Math.random() * 3,
    delay: Math.random() * 3,
  }));

  readonly comets = Array.from({ length: 4 }, (_, i) => ({
    id: i,
    top: 5 + i * 22 + Math.random() * 10,
    right: 5 + i * 15,
    duration: 4.5 + Math.random() * 3,
    delay: i * 2.5 + Math.random() * 2,
  }));

  readonly motes = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 3 + Math.random() * 6,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 6,
  }));

  readonly steams = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: 20 + Math.random() * 60,
    bottom: 0 + Math.random() * 20,
    size: 50 + Math.random() * 80,
    duration: 5 + Math.random() * 5,
    delay: Math.random() * 4,
  }));

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isZenMode()) {
      event.preventDefault();
      this.toggleZenMode(false);
    }
  }

  toggleZenMode(val?: boolean): void {
    const next = val !== undefined ? val : !this.isZenMode();
    this.state.toggleZenMode(next);
    if (next) {
      this.quoteIndex.update((i) => i + 1);
    }
  }

  private timerInterval: any = null;

  readonly methodPresets: MethodPreset[] = [
    {
      id: 'pomodoro_25_5',
      name: 'Pomodoro Clásico',
      workMin: 25,
      breakMin: 5,
      desc: '25 min de foco + 5 min de descanso activo',
    },
    {
      id: 'pomodoro_50_10',
      name: 'Foco Profundo (50/10)',
      workMin: 50,
      breakMin: 10,
      desc: '50 min para problemas complejos + 10 min descanso',
    },
    {
      id: 'method_52_17',
      name: 'Regla 52 / 17',
      workMin: 52,
      breakMin: 17,
      desc: 'Basado en el ritmo ultradiano del cerebro humano',
    },
    {
      id: 'free_flow',
      name: 'Bloque Libre (90m)',
      workMin: 90,
      breakMin: 15,
      desc: 'Inmersión prolongada para redacción y proyectos',
    },
  ];

  readonly currentTask = computed(() => {
    const id = this.selectedTaskId();
    return this.state.tasks().find((t) => t.id === id);
  });

  readonly timeFormatted = computed(() => {
    const total = this.timeLeft();
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  readonly radius = 120;
  readonly circumference = 2 * Math.PI * 120;

  readonly strokeDashoffset = computed(() => {
    const totalSecs =
      this.mode() === 'work' ? this.workDurationMinutes() * 60 : this.breakDurationMinutes() * 60;
    if (totalSecs === 0) return 0;
    const progressRatio = (totalSecs - this.timeLeft()) / totalSecs;
    return this.circumference - progressRatio * this.circumference;
  });

  constructor() {
    // Ambient sound reaction
    effect(() => {
      const running = this.isRunning();
      const soundType = this.ambientSound();
      const currentMode = this.mode();
      const vol = this.ambientVolume();
      const soundEnabled = this.state.preferences().soundEnabled;

      if (running && soundType !== 'off' && currentMode === 'work' && soundEnabled) {
        this.audio.startAmbient(soundType, vol);
      } else {
        this.audio.stopAmbient();
      }
    });

    // Update global state for Navbar active timer badge
    effect(() => {
      this.state.updateActiveTimer({
        isRunning: this.isRunning(),
        timeLeft: this.timeLeft(),
        mode: this.mode(),
        taskTitle: this.currentTask()?.title,
      });
    });
  }

  ngOnInit(): void {
    const initial = this.state.initialPomodoroTask();
    if (initial) {
      this.selectedTaskId.set(initial.id);
    }
  }

  ngOnDestroy(): void {
    this.stopInterval();
    this.audio.stopAmbient();
  }

  private startInterval(): void {
    this.stopInterval();
    this.timerInterval = setInterval(() => {
      const current = this.timeLeft();
      if (current <= 1) {
        this.timeLeft.set(0);
        this.handlePhaseComplete();
      } else {
        this.timeLeft.set(current - 1);
      }
    }, 1000);
  }

  private stopInterval(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handleSelectMethod(presetId: StudyMethodType): void {
    const preset = this.methodPresets.find((p) => p.id === presetId);
    if (!preset) return;
    this.method.set(presetId);
    this.workDurationMinutes.set(preset.workMin);
    this.breakDurationMinutes.set(preset.breakMin);
    if (!this.isRunning()) {
      this.mode.set('work');
      this.timeLeft.set(preset.workMin * 60);
    }
  }

  handleTogglePlay(): void {
    if (this.state.preferences().soundEnabled) {
      this.audio.playTick();
    }
    const newRunning = !this.isRunning();
    this.isRunning.set(newRunning);
    if (newRunning) {
      this.startInterval();
    } else {
      this.stopInterval();
    }
  }

  handleReset(): void {
    this.isRunning.set(false);
    this.stopInterval();
    this.timeLeft.set(
      this.mode() === 'work' ? this.workDurationMinutes() * 60 : this.breakDurationMinutes() * 60
    );
  }

  handleSkipPhase(): void {
    this.isRunning.set(false);
    this.stopInterval();
    if (this.mode() === 'work') {
      this.mode.set('break');
      this.timeLeft.set(this.breakDurationMinutes() * 60);
    } else {
      this.mode.set('work');
      this.timeLeft.set(this.workDurationMinutes() * 60);
    }
  }

  private handlePhaseComplete(): void {
    this.isRunning.set(false);
    this.stopInterval();
    const soundEnabled = this.state.preferences().soundEnabled;

    if (this.mode() === 'work') {
      if (soundEnabled) this.audio.playCompletionChime();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      this.completedCycles.update((c) => c + 1);
      this.showCompletionModal.set(true);
    } else {
      if (soundEnabled) this.audio.playBreakChime();
      alert('¡Descanso terminado! Listo para el siguiente ciclo de foco.');
      this.mode.set('work');
      this.timeLeft.set(this.workDurationMinutes() * 60);
    }
  }

  handleSaveCompletedSession(): void {
    const task = this.currentTask();
    this.state.logFocusSession({
      courseId: task?.courseId || 'general',
      taskId: this.selectedTaskId() || undefined,
      taskTitle: task?.title || 'Sesión de Foco Libre',
      method: this.method(),
      durationMinutes: this.workDurationMinutes(),
      timestamp: new Date().toISOString(),
      notes: this.sessionNotes,
      energyLevel: this.energyRating(),
    });

    this.showCompletionModal.set(false);
    this.sessionNotes = '';

    // Transition to break
    this.mode.set('break');
    this.timeLeft.set(this.breakDurationMinutes() * 60);
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

  getStarsArray(count: number): number[] {
    return Array.from({ length: count });
  }
}
