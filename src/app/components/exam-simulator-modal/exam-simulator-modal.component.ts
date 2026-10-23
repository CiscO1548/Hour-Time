import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../services/cronos-state.service';
import { AudioService } from '../../services/audio.service';
import { IconComponent } from '../icon/icon.component';
import { QuizQuestion, ExamSimulationResult } from '../../../types';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-exam-simulator-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './exam-simulator-modal.component.html',
})
export class ExamSimulatorModalComponent implements OnDestroy {
  readonly state = inject(CronosStateService);
  readonly audio = inject(AudioService);

  // Setup state
  readonly selectedCourseId = signal<string>(this.state.examSimulatorTargetCourseId() || 'c1');
  readonly difficulty = signal<'baja' | 'media' | 'alta'>('media');
  readonly questionCount = signal<number>(5);
  readonly customTopic = signal<string>('');

  // Simulation run state
  readonly isGenerating = signal<boolean>(false);
  readonly isRunning = signal<boolean>(false);
  readonly isFinished = signal<boolean>(false);

  readonly questions = signal<QuizQuestion[]>([]);
  readonly currentQuestionIndex = signal<number>(0);
  readonly selectedAnswers = signal<{ [qId: string]: string }>({});
  readonly timeRemainingSeconds = signal<number>(600); // 10 min
  readonly startTime = signal<number>(0);

  private timerInterval: any = null;

  readonly activeCourse = computed(() =>
    this.state.courses().find((c) => c.id === this.selectedCourseId()) || this.state.courses()[0]
  );

  readonly currentQuestion = computed(() =>
    this.questions()[this.currentQuestionIndex()] || null
  );

  readonly correctCount = computed(() => {
    const answers = this.selectedAnswers();
    return this.questions().filter((q) => {
      const selected = answers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      return selected === correctOpt?.id;
    }).length;
  });

  readonly finalScore = computed(() => {
    if (this.questions().length === 0) return 0;
    return Math.round((this.correctCount() / this.questions().length) * 20 * 10) / 10;
  });

  readonly weakTopics = computed(() => {
    const answers = this.selectedAnswers();
    const weak = new Set<string>();
    this.questions().forEach((q) => {
      const selected = answers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (selected !== correctOpt?.id && q.topicTag) {
        weak.add(q.topicTag);
      }
    });
    return Array.from(weak);
  });

  readonly timeFormatted = computed(() => {
    const total = this.timeRemainingSeconds();
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  ngOnDestroy(): void {
    this.clearInterval();
  }

  private clearInterval(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  generateExam(): void {
    this.isGenerating.set(true);
    const course = this.activeCourse();

    setTimeout(() => {
      const sampleQuestions: QuizQuestion[] = this.buildMockQuestions(course?.id || 'c1', this.difficulty());
      this.questions.set(sampleQuestions.slice(0, this.questionCount()));
      this.currentQuestionIndex.set(0);
      this.selectedAnswers.set({});
      this.timeRemainingSeconds.set(this.questionCount() * 120); // 2 min per question
      this.startTime.set(Date.now());
      this.isGenerating.set(false);
      this.isRunning.set(true);
      this.isFinished.set(false);

      this.clearInterval();
      this.timerInterval = setInterval(() => {
        const cur = this.timeRemainingSeconds();
        if (cur <= 1) {
          this.submitExam();
        } else {
          this.timeRemainingSeconds.set(cur - 1);
        }
      }, 1000);
    }, 900);
  }

  selectOption(questionId: string, optionId: string): void {
    if (this.isFinished()) return;
    this.selectedAnswers.update((prev) => ({ ...prev, [questionId]: optionId }));
    if (this.state.preferences().soundEnabled) {
      this.audio.playTick();
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex() < this.questions().length - 1) {
      this.currentQuestionIndex.update((i) => i + 1);
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update((i) => i - 1);
    }
  }

  submitExam(): void {
    this.clearInterval();
    this.isRunning.set(false);
    this.isFinished.set(true);

    const score = this.finalScore();
    const course = this.activeCourse();
    const timeSpent = Math.floor((Date.now() - this.startTime()) / 1000);

    const result: ExamSimulationResult = {
      id: `sim-${Date.now()}`,
      courseId: course?.id || 'c1',
      courseName: course?.name || 'Materia Universitaria',
      title: `Simulacro: ${course?.name || 'General'}`,
      difficulty: this.difficulty(),
      score,
      totalQuestions: this.questions().length,
      correctCount: this.correctCount(),
      timestamp: new Date().toISOString(),
      timeSpentSeconds: timeSpent,
      weakTopics: this.weakTopics(),
      recommendedStudyHours: Math.max(1.5, Math.round((20 - score) * 0.4 * 10) / 10),
    };

    this.state.saveExamSimulationResult(result);

    if (score >= 14) {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      if (this.state.preferences().soundEnabled) {
        this.audio.playCompletionChime();
      }
    }
  }

  createReinforcementStudyBlock(): void {
    const course = this.activeCourse();
    const weak = this.weakTopics()[0] || 'Refuerzo de conceptos clave';
    this.state.timeBlocks.update((prev) => [
      {
        id: `tb-weak-${Date.now()}`,
        title: `Refuerzo IA: ${weak}`,
        courseId: course?.id,
        dayOfWeek: (new Date().getDay() + 1) % 7,
        startTime: '16:00',
        endTime: '17:30',
        type: 'study',
        technique: 'Feynman Technique & Active Recall',
        priority: 'alta',
        isAiSuggested: true,
        notes: `Generado tras simulacro de examen con nota ${this.finalScore()}/20.`,
      },
      ...prev,
    ]);
    this.state.addNotification({
      id: `notif-reinforce-${Date.now()}`,
      title: '✨ Bloque de Refuerzo Agendado',
      message: `Se programó un bloque para repasar "${weak}" en tu horario semanal.`,
      type: 'study_block',
      timestamp: new Date().toISOString(),
      read: false,
    });
    this.state.closeExamSimulator();
    this.state.setTab('schedule');
  }

  getCorrectOption(q: QuizQuestion) {
    return q.options.find((o) => o.isCorrect);
  }

  isOptionCorrect = (opt: any): boolean => {
    return !!opt && opt.isCorrect === true;
  };

  close(): void {
    this.clearInterval();
    this.state.closeExamSimulator();
  }

  private buildMockQuestions(courseId: string, diff: 'baja' | 'media' | 'alta'): QuizQuestion[] {
    if (courseId === 'c1') {
      return [
        {
          id: 'q1',
          question: '¿Cuál es la condición necesaria para que el Teorema de Green sea aplicable a una curva C en el plano ℝ²?',
          options: [
            { id: 'o1', text: 'La curva C debe ser cerrada, simple y suave a trozos con orientación positiva.', isCorrect: true },
            { id: 'o2', text: 'La curva C debe ser abierta y el campo vectorial F debe ser solenoidal.', isCorrect: false },
            { id: 'o3', text: 'La región D debe tener divergencia nula en todos sus puntos interiores.', isCorrect: false },
            { id: 'o4', text: 'El campo vectorial solo puede contener polinomios de primer grado.', isCorrect: false },
          ],
          explanation: 'El Teorema de Green relaciona la integral de línea a lo largo de una curva cerrada simple C con la integral doble sobre la región D que encierra, exigiendo orientación antihoraria (positiva).',
          topicTag: 'Teorema de Green',
        },
        {
          id: 'q2',
          question: 'Si f(x, y) = x²y + 3y³, ¿cuál es la derivada parcial respecto a x evaluada en (2, 1)?',
          options: [
            { id: 'o1', text: '4', isCorrect: true },
            { id: 'o2', text: '7', isCorrect: false },
            { id: 'o3', text: '13', isCorrect: false },
            { id: 'o4', text: '0', isCorrect: false },
          ],
          explanation: '∂f/∂x = 2xy. Evaluando en (2, 1): 2(2)(1) = 4. El término 3y³ se comporta como constante.',
          topicTag: 'Derivadas Parciales',
        },
        {
          id: 'q3',
          question: '¿Qué representa geométricamente el vector Gradiente ∇f(x, y) en un punto dado?',
          options: [
            { id: 'o1', text: 'La dirección de máxima tasa de crecimiento de la función f.', isCorrect: true },
            { id: 'o2', text: 'El plano tangente a la curva de nivel.', isCorrect: false },
            { id: 'o3', text: 'La tasa de curvatura del campo vectorial.', isCorrect: false },
            { id: 'o4', text: 'El volumen encerrado por la superficie cuadrática.', isCorrect: false },
          ],
          explanation: 'El gradiente apunta en la dirección en la cual la derivada direccional alcanza su valor máximo, y es perpendicular a las curvas de nivel.',
          topicTag: 'Gradiente y Derivada Direccional',
        },
        {
          id: 'q4',
          question: 'Al calcular una integral doble en coordenadas polares, ¿cuál es el factor de escala (jacobiano) de la transformación?',
          options: [
            { id: 'o1', text: 'r (dr dθ)', isCorrect: true },
            { id: 'o2', text: 'r² (dr dθ)', isCorrect: false },
            { id: 'o3', text: '1 / r (dr dθ)', isCorrect: false },
            { id: 'o4', text: 'sin(θ) (dr dθ)', isCorrect: false },
          ],
          explanation: 'El jacobiano de la transformación x = r cos θ, y = r sin θ es |J| = r. Por ende, dA = r dr dθ.',
          topicTag: 'Coordenadas Polares & Integrales',
        },
        {
          id: 'q5',
          question: '¿Qué criterio asegura que un punto crítico (a, b) sea un Punto de Silla según la matriz Hessiana?',
          options: [
            { id: 'o1', text: 'El determinante de la Hessiana es negativo: D < 0.', isCorrect: true },
            { id: 'o2', text: 'D > 0 y f_xx > 0.', isCorrect: false },
            { id: 'o3', text: 'D = 0 en cualquier dirección.', isCorrect: false },
            { id: 'o4', text: 'D > 0 y f_yy < 0.', isCorrect: false },
          ],
          explanation: 'Cuando D = f_xx * f_yy - (f_xy)² < 0, la superficie posee curvaturas de signos opuestos en direcciones ortogonales, caracterizando un Punto de Silla.',
          topicTag: 'Optimización & Hessiana',
        },
      ];
    } else if (courseId === 'c2') {
      return [
        {
          id: 'q1',
          question: 'En un Árbol AVL, ¿cuál es la condición para realizar una Rotación Doble Izquierda-Derecha (LR)?',
          options: [
            { id: 'o1', text: 'Nodo desbalanceado con FB = +2 y su hijo izquierdo con FB = -1.', isCorrect: true },
            { id: 'o2', text: 'Nodo desbalanceado con FB = +2 y su hijo izquierdo con FB = +1.', isCorrect: false },
            { id: 'o3', text: 'Nodo desbalanceado con FB = -2 y su hijo derecho con FB = -1.', isCorrect: false },
            { id: 'o4', text: 'Cualquier árbol binario con más de 10 niveles.', isCorrect: false },
          ],
          explanation: 'Un desbalance LR ocurre cuando la inserción se produjo en el subárbol derecho del hijo izquierdo, requiriendo una rotación izquierda sobre el hijo y luego rotación derecha sobre el padre.',
          topicTag: 'Árboles AVL',
        },
        {
          id: 'q2',
          question: '¿Cuál es la complejidad temporal del Algoritmo de Dijkstra implementado con una cola de prioridad (Min-Heap)?',
          options: [
            { id: 'o1', text: 'O((V + E) log V)', isCorrect: true },
            { id: 'o2', text: 'O(V²)', isCorrect: false },
            { id: 'o3', text: 'O(V * E²)', isCorrect: false },
            { id: 'o4', text: 'O(2^V)', isCorrect: false },
          ],
          explanation: 'Con Min-Heap binario, la extracción del vértice mínimo toma O(log V) y la actualización de distancias de aristas O(E log V), totalizando O((V + E) log V).',
          topicTag: 'Algoritmo de Dijkstra & Grafos',
        },
        {
          id: 'q3',
          question: '¿Qué propiedad diferencia a la Programación Dinámica del paradigma Divide y Vencerás?',
          options: [
            { id: 'o1', text: 'La existencia de subproblemas superpuestos y memoización.', isCorrect: true },
            { id: 'o2', text: 'El uso exclusivo de recursión sin memoria auxiliar.', isCorrect: false },
            { id: 'o3', text: 'La garantía de ejecutar siempre en O(1) tiempo constante.', isCorrect: false },
            { id: 'o4', text: 'No requiere estructura de datos para almacenar estados.', isCorrect: false },
          ],
          explanation: 'La Programación Dinámica resuelve subproblemas superpuestos y almacena sus soluciones en una tabla (memoización o tabulación) para evitar recalcular.',
          topicTag: 'Programación Dinámica',
        },
      ];
    } else {
      return [
        {
          id: 'q1',
          question: '¿Cuál de las siguientes magnitudes vectoriales describe la velocidad de cambio del flujo magnético?',
          options: [
            { id: 'o1', text: 'Fuerza electromotriz inducida (Ley de Faraday)', isCorrect: true },
            { id: 'o2', text: 'Permeabilidad magnética del vacío', isCorrect: false },
            { id: 'o3', text: 'Constante dieléctrica de Coulomb', isCorrect: false },
            { id: 'o4', text: 'Resistencia interna del generador', isCorrect: false },
          ],
          explanation: 'La Ley de Faraday establece que la FEM inducida es igual a la derivada negativa respecto al tiempo del flujo magnético: ε = -dΦ/dt.',
          topicTag: 'Ley de Faraday & Maxwell',
        },
      ];
    }
  }
}
