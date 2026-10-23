import { Injectable, signal, computed, effect } from '@angular/core';
import {
  Course,
  Exam,
  Task,
  TimeBlock,
  FocusSession,
  StudentPreferences,
  AppNotification,
  TabType,
  StudyMethodType,
  ImminentAlertItem,
  ExtractedAcademicEntity,
} from '../../types';
import {
  INITIAL_COURSES,
  INITIAL_EXAMS,
  INITIAL_TASKS,
  INITIAL_TIME_BLOCKS,
  INITIAL_FOCUS_SESSIONS,
  INITIAL_PREFERENCES,
  INITIAL_ACHIEVEMENTS,
  INITIAL_SKILL_NODES,
  INITIAL_VOICE_MEMOS,
  INITIAL_COURSE_DOCUMENTS,
} from '../data/initial-data';
import {
  AchievementBadge,
  SkillNode,
  VoiceMemoNote,
  CourseDocument,
  ExamSimulationResult,
} from '../../types';

const STORAGE_KEYS = {
  COURSES: 'cronos_courses_v2',
  EXAMS: 'cronos_exams_v2',
  TASKS: 'cronos_tasks_v2',
  TIME_BLOCKS: 'cronos_time_blocks_v2',
  FOCUS_SESSIONS: 'cronos_focus_sessions_v2',
  PREFERENCES: 'cronos_preferences_v2',
  READ_NOTIFS: 'cronos_read_notifs_v2',
  ACHIEVEMENTS: 'cronos_achievements_v2',
  SKILL_NODES: 'cronos_skills_v2',
  VOICE_MEMOS: 'cronos_voice_memos_v2',
  COURSE_DOCS: 'cronos_course_docs_v2',
  EXAM_RESULTS: 'cronos_exam_results_v2',
  TOTAL_XP: 'cronos_total_xp_v2',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error loading key "${key}":`, e);
    return fallback;
  }
}

function saveStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving key "${key}":`, e);
  }
}

@Injectable({
  providedIn: 'root',
})
export class CronosStateService {
  // Navigation
  readonly currentTab = signal<TabType>('overview');

  // Domain State with Signal initialization
  readonly courses = signal<Course[]>(loadStored<Course[]>(STORAGE_KEYS.COURSES, INITIAL_COURSES));
  readonly exams = signal<Exam[]>(loadStored<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS));
  readonly tasks = signal<Task[]>(loadStored<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS));
  readonly timeBlocks = signal<TimeBlock[]>(
    loadStored<TimeBlock[]>(STORAGE_KEYS.TIME_BLOCKS, INITIAL_TIME_BLOCKS)
  );
  readonly focusSessions = signal<FocusSession[]>(
    loadStored<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, INITIAL_FOCUS_SESSIONS)
  );
  readonly preferences = signal<StudentPreferences>(
    loadStored<StudentPreferences>(STORAGE_KEYS.PREFERENCES, INITIAL_PREFERENCES)
  );
  readonly readNotificationIds = signal<string[]>(
    loadStored<string[]>(STORAGE_KEYS.READ_NOTIFS, [])
  );

  // Gamification & RPG Domain State
  readonly totalXp = signal<number>(loadStored<number>(STORAGE_KEYS.TOTAL_XP, 1250));
  readonly achievements = signal<AchievementBadge[]>(
    loadStored<AchievementBadge[]>(STORAGE_KEYS.ACHIEVEMENTS, INITIAL_ACHIEVEMENTS)
  );
  readonly skillNodes = signal<SkillNode[]>(
    loadStored<SkillNode[]>(STORAGE_KEYS.SKILL_NODES, INITIAL_SKILL_NODES)
  );

  readonly customNotifications = signal<AppNotification[]>([]);

  // Smart Voice Memos & Course Documents
  readonly voiceMemos = signal<VoiceMemoNote[]>(
    loadStored<VoiceMemoNote[]>(STORAGE_KEYS.VOICE_MEMOS, INITIAL_VOICE_MEMOS)
  );
  readonly courseDocuments = signal<CourseDocument[]>(
    loadStored<CourseDocument[]>(STORAGE_KEYS.COURSE_DOCS, INITIAL_COURSE_DOCUMENTS)
  );
  readonly examResults = signal<ExamSimulationResult[]>(
    loadStored<ExamSimulationResult[]>(STORAGE_KEYS.EXAM_RESULTS, [])
  );

  // Active Timer state for Navbar badge and focus mode sync
  readonly activeTimerState = signal<{
    isRunning: boolean;
    timeLeft: number;
    mode: 'work' | 'break';
    taskTitle?: string;
  }>({
    isRunning: false,
    timeLeft: 25 * 60,
    mode: 'work',
  });

  readonly initialPomodoroTask = signal<Task | null>(null);

  // Modals state
  readonly isAiOptimizerOpen = signal<boolean>(false);
  readonly isQuickAddOpen = signal<boolean>(false);
  readonly isCalendarSyncOpen = signal<boolean>(false);
  readonly isConflictResolverOpen = signal<boolean>(false);
  readonly isCognitiveAdaptationOpen = signal<boolean>(false);
  readonly isCommuteModalOpen = signal<boolean>(false);
  readonly isMultiAgentHubOpen = signal<boolean>(false);
  readonly imminentAlert = signal<ImminentAlertItem | null>(null);
  readonly isFlashcardsOpen = signal<boolean>(false);
  readonly flashcardTargetCourse = signal<string>('');
  readonly flashcardTargetTopic = signal<string>('');
  readonly isCommandPaletteOpen = signal<boolean>(false);
  readonly isZenMode = signal<boolean>(false);

  // New Feature Modals state
  readonly isExamSimulatorOpen = signal<boolean>(false);
  readonly examSimulatorTargetCourseId = signal<string>('');
  readonly isDocumentChatOpen = signal<boolean>(false);
  readonly documentChatTargetDocId = signal<string>('');
  readonly isAcademicRpgOpen = signal<boolean>(false);
  readonly isVoiceMemoOpen = signal<boolean>(false);
  readonly isPortfolioExportOpen = signal<boolean>(false);
  readonly isFloatingWidgetOpen = signal<boolean>(false);

  openExamSimulator(courseId?: string): void {
    this.examSimulatorTargetCourseId.set(courseId || this.courses()[0]?.id || 'c1');
    this.isExamSimulatorOpen.set(true);
  }

  closeExamSimulator(): void {
    this.isExamSimulatorOpen.set(false);
  }

  openDocumentChat(docId?: string): void {
    this.documentChatTargetDocId.set(docId || this.courseDocuments()[0]?.id || 'doc1');
    this.isDocumentChatOpen.set(true);
  }

  closeDocumentChat(): void {
    this.isDocumentChatOpen.set(false);
  }

  openAcademicRpg(): void {
    this.isAcademicRpgOpen.set(true);
  }

  closeAcademicRpg(): void {
    this.isAcademicRpgOpen.set(false);
  }

  openVoiceMemo(): void {
    this.isVoiceMemoOpen.set(true);
  }

  closeVoiceMemo(): void {
    this.isVoiceMemoOpen.set(false);
  }

  openPortfolioExport(): void {
    this.isPortfolioExportOpen.set(true);
  }

  closePortfolioExport(): void {
    this.isPortfolioExportOpen.set(false);
  }

  toggleFloatingWidget(open?: boolean): void {
    this.isFloatingWidgetOpen.set(open !== undefined ? open : !this.isFloatingWidgetOpen());
  }

  openFlashcards(courseName?: string, topic?: string): void {
    const defaultCourse = courseName || this.courses()[0]?.name || 'Ingeniería & Software';
    const defaultTopic = topic || 'Conceptos Fundamentales & Exámenes';
    this.flashcardTargetCourse.set(defaultCourse);
    this.flashcardTargetTopic.set(defaultTopic);
    this.isFlashcardsOpen.set(true);
  }

  closeFlashcards(): void {
    this.isFlashcardsOpen.set(false);
  }

  toggleCommandPalette(open?: boolean): void {
    this.isCommandPaletteOpen.set(open !== undefined ? open : !this.isCommandPaletteOpen());
  }

  toggleZenMode(open?: boolean): void {
    this.isZenMode.set(open !== undefined ? open : !this.isZenMode());
  }

  // Gamification methods
  awardXp(amount: number, reason: string): void {
    this.totalXp.update((x) => {
      const next = x + amount;
      saveStored(STORAGE_KEYS.TOTAL_XP, next);
      return next;
    });
    this.addNotification({
      id: `xp-${Date.now()}`,
      title: `⚡ +${amount} XP Obtenidos`,
      message: reason,
      type: 'streak',
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  addNotification(notif: AppNotification): void {
    this.customNotifications.update((prev) => [notif, ...prev]);
  }

  unlockSkill(skillId: string): void {
    this.skillNodes.update((nodes) => {
      const updated = nodes.map((n) => (n.id === skillId ? { ...n, unlocked: true } : n));
      saveStored(STORAGE_KEYS.SKILL_NODES, updated);
      return updated;
    });
  }

  saveExamSimulationResult(result: ExamSimulationResult): void {
    this.examResults.update((prev) => {
      const updated = [result, ...prev];
      saveStored(STORAGE_KEYS.EXAM_RESULTS, updated);
      return updated;
    });
    // Award XP based on score
    this.awardXp(result.score * 20, `Simulacro completado: ${result.title} (${result.score}/20)`);
  }

  addVoiceMemo(memo: VoiceMemoNote): void {
    this.voiceMemos.update((prev) => {
      const updated = [memo, ...prev];
      saveStored(STORAGE_KEYS.VOICE_MEMOS, updated);
      return updated;
    });
    this.awardXp(75, `Nota de voz guardada y analizada: ${memo.title}`);
  }

  addCourseDocument(doc: CourseDocument): void {
    this.courseDocuments.update((prev) => {
      const updated = [doc, ...prev];
      saveStored(STORAGE_KEYS.COURSE_DOCS, updated);
      return updated;
    });
    this.awardXp(100, `Sílabo/Documento procesado: ${doc.fileName}`);
  }

  // RPG Level computations
  readonly academicLevel = computed(() => Math.floor(this.totalXp() / 500) + 1);
  readonly currentLevelProgress = computed(() => (this.totalXp() % 500) / 500 * 100);
  readonly academicTitle = computed(() => {
    const lvl = this.academicLevel();
    if (lvl >= 10) return 'Archimago del Conocimiento';
    if (lvl >= 7) return 'Investigador Senior';
    if (lvl >= 5) return 'Especialista Universitario';
    if (lvl >= 3) return 'Estudiante de Alto Rendimiento';
    return 'Iniciado Académico';
  });

  // Computed Values
  readonly pendingTasksCount = computed(() =>
    this.tasks().filter((t) => t.status !== 'completed').length
  );

  readonly upcomingExamsCount = computed(() =>
    this.exams().filter((e) => e.status === 'upcoming').length
  );

  // Active Overlap Conflicts Detection (Classes vs Blocks and Block vs Block)
  readonly detectedConflictsCount = computed(() => {
    let count = 0;
    const courses = this.courses();
    const blocks = this.timeBlocks();

    const parseMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    // 1. Conflict between official classes and study blocks
    courses.forEach((course) => {
      course.timeSlots.forEach((slot) => {
        const slotStart = parseMins(slot.startTime);
        const slotEnd = parseMins(slot.endTime);

        blocks.forEach((block) => {
          if (block.dayOfWeek === slot.dayOfWeek) {
            const bStart = parseMins(block.startTime);
            const bEnd = parseMins(block.endTime);
            if (bStart < slotEnd && bEnd > slotStart) {
              count++;
            }
          }
        });
      });
    });

    // 2. Conflict between two overlapping study blocks on the same day
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const b1 = blocks[i];
        const b2 = blocks[j];
        if (b1.dayOfWeek === b2.dayOfWeek) {
          const s1 = parseMins(b1.startTime);
          const e1 = parseMins(b1.endTime);
          const s2 = parseMins(b2.startTime);
          const e2 = parseMins(b2.endTime);
          if (Math.max(s1, s2) < Math.min(e1, e2)) {
            count++;
          }
        }
      }
    }

    return count;
  });

  checkSlotConflict(dayOfWeek: number, startTime: string, endTime: string, excludeBlockId?: string): { hasConflict: boolean; reason?: string } {
    const parseMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const targetStart = parseMins(startTime);
    const targetEnd = parseMins(endTime);
    if (targetStart >= targetEnd) {
      return { hasConflict: true, reason: 'La hora de inicio debe ser anterior a la hora de fin.' };
    }

    // Check with university classes
    for (const course of this.courses()) {
      for (const slot of course.timeSlots) {
        if (slot.dayOfWeek === dayOfWeek) {
          const sStart = parseMins(slot.startTime);
          const sEnd = parseMins(slot.endTime);
          if (Math.max(targetStart, sStart) < Math.min(targetEnd, sEnd)) {
            return {
              hasConflict: true,
              reason: `Ocupado por la clase obligatoria "${course.name}" (${slot.startTime} - ${slot.endTime})`,
            };
          }
        }
      }
    }

    // Check with existing study blocks
    for (const block of this.timeBlocks()) {
      if (block.id === excludeBlockId) continue;
      if (block.dayOfWeek === dayOfWeek) {
        const bStart = parseMins(block.startTime);
        const bEnd = parseMins(block.endTime);
        if (Math.max(targetStart, bStart) < Math.min(targetEnd, bEnd)) {
          return {
            hasConflict: true,
            reason: `Ocupado por el bloque "${block.title}" (${block.startTime} - ${block.endTime})`,
          };
        }
      }
    }

    return { hasConflict: false };
  }

  cleanupDuplicateBlocks(): void {
    const parseMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    this.timeBlocks.update((prev) => {
      const unique: TimeBlock[] = [];
      prev.forEach((block) => {
        const bStart = parseMins(block.startTime);
        const bEnd = parseMins(block.endTime);
        // Find if an identical or heavily overlapping duplicate exists
        const isDuplicate = unique.some((u) => {
          if (u.dayOfWeek !== block.dayOfWeek) return false;
          const uStart = parseMins(u.startTime);
          const uEnd = parseMins(u.endTime);
          const overlaps = Math.max(bStart, uStart) < Math.min(bEnd, uEnd);
          return overlaps && (u.title === block.title || (u.isAiSuggested && block.isAiSuggested));
        });
        if (!isDuplicate) {
          unique.push(block);
        }
      });
      return unique;
    });
  }

  readonly notifications = computed<AppNotification[]>(() => {
    const list: AppNotification[] = [];
    const readIds = this.readNotificationIds();
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    // Custom/dynamic user notifications
    this.customNotifications().forEach((n) => list.push({ ...n, read: readIds.includes(n.id) }));

    // 0. Mensaje de prueba del Agente Autónomo
    const agentTestId = 'agent-welcome-test-msg';
    list.push({
      id: agentTestId,
      title: '🤖 Agente Autónomo Cronos: Listo para tu semana universitaria',
      message: 'Mensaje de prueba: Tu motor de IA y resolución autónoma de conflictos está 100% activo. Puedes simular imprevistos o clases reprogramadas en cualquier momento.',
      type: 'system',
      timestamp: new Date().toISOString(),
      read: readIds.includes(agentTestId),
    });

    // 1. Check Exams in next 48h
    this.exams().forEach((exam) => {
      if (exam.status === 'completed') return;
      const examDate = new Date(exam.date);
      const diffHours = (examDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours > 0 && diffHours <= 48) {
        const id = `exam-alert-${exam.id}-${exam.date}`;
        list.push({
          id,
          title: `⚠️ Examen Próximo: ${exam.title}`,
          message: `Faltan menos de ${Math.round(diffHours)} horas para el examen. Revisa tu plan de estudio de IA.`,
          type: 'exam',
          timestamp: new Date().toISOString(),
          read: readIds.includes(id),
          targetId: exam.id,
        });
      }
    });

    // 2. Check Tasks Due Today
    this.tasks().forEach((task) => {
      if (task.status === 'completed' || !task.dueDate) return;
      if (task.dueDate === todayStr) {
        const id = `task-alert-today-${task.id}`;
        list.push({
          id,
          title: `⏳ Entrega para HOY: ${task.title}`,
          message: `Vence a las ${task.dueTime || '23:59'}. ¡Inicia un bloque de Pomodoro para finalizarla!`,
          type: 'task',
          timestamp: new Date().toISOString(),
          read: readIds.includes(id),
          targetId: task.id,
        });
      }
    });

    // 3. Streak notification if streak >= 3
    const streak = this.preferences().studyStreakDays || 0;
    if (streak >= 3) {
      const id = `streak-alert-${streak}`;
      list.push({
        id,
        title: `🔥 ¡Racha de ${streak} días de estudio!`,
        message: 'Has mantenido tu hábito de estudio diario. ¡Excelente consistencia!',
        type: 'streak',
        timestamp: new Date().toISOString(),
        read: readIds.includes(id),
      });
    }

    return list;
  });

  constructor() {
    // Clean any duplicated blocks on initialization
    this.cleanupDuplicateBlocks();
    // Start automated 10-min deadline background monitor
    this.startDeadlineMonitor();

    // Auto-persist Signals to LocalStorage using Angular Effects
    effect(() => {
      saveStored(STORAGE_KEYS.COURSES, this.courses());
    });
    effect(() => {
      saveStored(STORAGE_KEYS.EXAMS, this.exams());
    });
    effect(() => {
      saveStored(STORAGE_KEYS.TASKS, this.tasks());
    });
    effect(() => {
      saveStored(STORAGE_KEYS.TIME_BLOCKS, this.timeBlocks());
    });
    effect(() => {
      saveStored(STORAGE_KEYS.FOCUS_SESSIONS, this.focusSessions());
    });
    effect(() => {
      saveStored(STORAGE_KEYS.PREFERENCES, this.preferences());
    });
    effect(() => {
      saveStored(STORAGE_KEYS.READ_NOTIFS, this.readNotificationIds());
    });
    
    // Sync dark mode state with document HTML class
    effect(() => {
      const isDark = !!this.preferences().darkMode;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  // Navigation
  setTab(tab: TabType): void {
    this.currentTab.set(tab);
  }

  // Sound Toggle
  toggleSound(): void {
    this.preferences.update((p) => ({ ...p, soundEnabled: !p.soundEnabled }));
  }

  // Dark Mode Toggle
  toggleDarkMode(): void {
    this.preferences.update((p) => ({ ...p, darkMode: !p.darkMode }));
  }


  // Notifications
  markNotificationRead(id: string): void {
    this.readNotificationIds.update((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  clearAllNotifications(): void {
    const allIds = this.notifications().map((n) => n.id);
    this.readNotificationIds.set(allIds);
  }

  // Tasks actions
  toggleTaskComplete(taskId: string): void {
    this.tasks.update((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: t.status === 'completed' ? 'pending' : 'completed',
              completedAt: t.status === 'completed' ? undefined : new Date().toISOString(),
            }
          : t
      )
    );
  }

  toggleSubtask(taskId: string, subtaskId: string): void {
    this.tasks.update((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSubtasks = t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks: updatedSubtasks };
      })
    );
  }

  deleteTask(taskId: string): void {
    this.tasks.update((prev) => prev.filter((t) => t.id !== taskId));
  }

  addTask(taskData: Omit<Task, 'id' | 'createdAt'>): void {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.tasks.update((prev) => [newTask, ...prev]);
  }

  updateTask(updatedTask: Task): void {
    this.tasks.update((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  }

  // Exams actions
  addExam(examData: Omit<Exam, 'id'>): void {
    const newExam: Exam = {
      ...examData,
      id: `exam-${Date.now()}`,
    };
    this.exams.update((prev) => [...prev, newExam]);
  }

  deleteExam(examId: string): void {
    this.exams.update((prev) => prev.filter((e) => e.id !== examId));
  }

  updateExam(updatedExam: Exam): void {
    this.exams.update((prev) => prev.map((e) => (e.id === updatedExam.id ? updatedExam : e)));
  }

  // Courses actions
  addCourse(courseData: Omit<Course, 'id'>): void {
    const newCourse: Course = {
      ...courseData,
      id: `c-${Date.now()}`,
    };
    this.courses.update((prev) => [...prev, newCourse]);
  }

  deleteCourse(courseId: string): void {
    this.courses.update((prev) => prev.filter((c) => c.id !== courseId));
  }

  // TimeBlocks actions
  addTimeBlock(blockData: Omit<TimeBlock, 'id'>): void {
    const newBlock: TimeBlock = {
      ...blockData,
      id: `tb-${Date.now()}`,
    };
    this.timeBlocks.update((prev) => [...prev, newBlock]);
  }

  deleteTimeBlock(blockId: string): void {
    this.timeBlocks.update((prev) => prev.filter((b) => b.id !== blockId));
  }

  updateTimeBlock(updatedBlock: TimeBlock): void {
    this.timeBlocks.update((prev) => prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
  }

  moveTimeBlock(blockId: string, newDay: number, newStartTime: string, newEndTime: string): { success: boolean; error?: string } {
    const targetBlock = this.timeBlocks().find((b) => b.id === blockId);
    if (!targetBlock) {
      return { success: false, error: 'Bloque no encontrado' };
    }

    const parseDec = (t: string) => {
      const [h, m] = (t || '00:00').split(':').map(Number);
      return (h || 0) + (m || 0) / 60;
    };

    const newStartDec = parseDec(newStartTime);
    const newEndDec = parseDec(newEndTime);

    // Check if it collides with an official university class
    const collidingClass = this.courses().find((course) =>
      course.timeSlots.some((slot) => {
        if (slot.dayOfWeek !== newDay) return false;
        const classStart = parseDec(slot.startTime);
        const classEnd = parseDec(slot.endTime);
        return Math.max(newStartDec, classStart) < Math.min(newEndDec, classEnd);
      })
    );

    if (collidingClass) {
      return {
        success: false,
        error: `No se puede mover aquí: Choca con la clase obligatoria "${collidingClass.name}". Las clases son fijas e inmutables.`,
      };
    }

    // Update block position
    this.timeBlocks.update((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              dayOfWeek: newDay,
              startTime: newStartTime,
              endTime: newEndTime,
            }
          : b
      )
    );

    return { success: true };
  }

  autoBalanceAllBlocks(): { displacedCount: number; summary: string } {
    const parseDec = (t: string) => {
      const [h, m] = (t || '00:00').split(':').map(Number);
      return (h || 0) + (m || 0) / 60;
    };
    const decToTime = (dec: number) => {
      const h = Math.floor(dec);
      const m = Math.round((dec - h) * 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const courses = this.courses();
    const currentBlocks = [...this.timeBlocks()];
    let displacedCount = 0;

    // Build occupied classes map
    const occupiedByDay: { [day: number]: { start: number; end: number }[] } = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };

    courses.forEach((c) => {
      c.timeSlots.forEach((slot) => {
        if (occupiedByDay[slot.dayOfWeek]) {
          occupiedByDay[slot.dayOfWeek].push({
            start: parseDec(slot.startTime),
            end: parseDec(slot.endTime),
          });
        }
      });
    });

    const balancedBlocks: TimeBlock[] = [];

    currentBlocks.forEach((block) => {
      const duration = parseDec(block.endTime) - parseDec(block.startTime);
      const safeDuration = duration > 0 && duration <= 3 ? duration : 1.5;
      let day = block.dayOfWeek;
      let startDec = parseDec(block.startTime);

      const dayOccupied = occupiedByDay[day] || [];
      const hasConflict = dayOccupied.some(
        (o) => Math.max(startDec, o.start) < Math.min(startDec + safeDuration, o.end)
      );

      if (!hasConflict) {
        dayOccupied.push({ start: startDec, end: startDec + safeDuration });
        balancedBlocks.push(block);
      } else {
        displacedCount++;
        // Find best free slot for this block
        const candidates = [14.0, 16.0, 18.0, 19.5, 8.0, 10.0];
        let foundStart: number | null = null;

        for (const cand of candidates) {
          const overlaps = dayOccupied.some(
            (o) => Math.max(cand, o.start) < Math.min(cand + safeDuration, o.end)
          );
          if (!overlaps) {
            foundStart = cand;
            break;
          }
        }

        if (foundStart === null) {
          for (let h = 8; h <= 19; h += 0.5) {
            const overlaps = dayOccupied.some(
              (o) => Math.max(h, o.start) < Math.min(h + safeDuration, o.end)
            );
            if (!overlaps) {
              foundStart = h;
              break;
            }
          }
        }

        const resolvedStart = foundStart !== null ? foundStart : 18.0;
        const newStartStr = decToTime(resolvedStart);
        const newEndStr = decToTime(resolvedStart + safeDuration);

        dayOccupied.push({ start: resolvedStart, end: resolvedStart + safeDuration });
        balancedBlocks.push({
          ...block,
          startTime: newStartStr,
          endTime: newEndStr,
          isAiSuggested: true,
          notes: (block.notes ? block.notes + ' • ' : '') + 'Reacomodado por IA para evitar colisión con clases.',
        });
      }
    });

    this.timeBlocks.set(balancedBlocks);
    return {
      displacedCount,
      summary: displacedCount > 0
        ? `Se reacomodaron ${displacedCount} bloque(s) de estudio a huecos 100% libres sin solapamiento.`
        : 'Tu horario ya se encuentra perfectamente optimizado y libre de choques con clases.',
    };
  }

  applySuggestedBlocks(suggested: Omit<TimeBlock, 'id'>[], replaceAiBlocks: boolean = true): void {
    const newBlocks: TimeBlock[] = suggested.map((s, idx) => ({
      ...s,
      id: `tb-ai-${Date.now()}-${idx}`,
      isAiSuggested: true,
    }));

    if (replaceAiBlocks) {
      this.timeBlocks.update((prev) => {
        const customBlocks = prev.filter((b) => !b.isAiSuggested);
        return [...customBlocks, ...newBlocks];
      });
    } else {
      this.timeBlocks.update((prev) => [...prev, ...newBlocks]);
    }
    this.currentTab.set('schedule');
  }

  applyResolvedSchedule(updatedBlocks: TimeBlock[]): void {
    this.timeBlocks.set(updatedBlocks);
    this.currentTab.set('schedule');
  }

  applyCognitiveRoutine(updatedBlocks: TimeBlock[]): void {
    this.timeBlocks.set(updatedBlocks);
    this.currentTab.set('schedule');
  }

  // Focus and Pomodoro actions
  startFocusWithTask(task: Task, method?: StudyMethodType): void {
    this.initialPomodoroTask.set(task);
    this.currentTab.set('pomodoro');
  }

  logFocusSession(sessionData: Omit<FocusSession, 'id'>): void {
    const newSession: FocusSession = {
      ...sessionData,
      id: `fs-${Date.now()}`,
    };
    this.focusSessions.update((prev) => [newSession, ...prev]);
  }

  updateActiveTimer(state: {
    isRunning: boolean;
    timeLeft: number;
    mode: 'work' | 'break';
    taskTitle?: string;
  }): void {
    this.activeTimerState.set(state);
  }

  // Real-time automatic 10-minute deadline monitor
  private readonly alertedTaskIds = new Set<string>();

  startDeadlineMonitor(): void {
    if (typeof window === 'undefined') return;
    const checkDeadlines = () => {
      // Don't open if a modal is already displayed
      if (this.imminentAlert()) return;

      const todayStr = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();

      const pendingTasks = this.tasks().filter(
        (t) => t.status !== 'completed' && t.dueDate === todayStr && !!t.dueTime
      );

      for (const task of pendingTasks) {
        if (this.alertedTaskIds.has(task.id)) continue;
        const [h, m] = (task.dueTime || '23:59').split(':').map(Number);
        const dueMins = (h || 0) * 60 + (m || 0);
        const diff = dueMins - currentMins;

        // If due in <= 10 minutes (and not past by more than 5 minutes)
        if (diff > 0 && diff <= 10) {
          this.alertedTaskIds.add(task.id);
          this.triggerImminentAlert(task, Math.max(1, Math.round(diff)));
          break;
        }
      }
    };

    setInterval(checkDeadlines, 20000); // Check every 20 seconds
    setTimeout(checkDeadlines, 2000); // Run initial check shortly after startup
  }

  // Imminent 10-Minute Deadline Warning & Smart Re-accommodation
  triggerImminentAlert(task: Task, minutesRemaining: number = 10): void {
    const course = this.courses().find((c) => c.id === task.courseId);
    const alertItem: ImminentAlertItem = {
      id: `alert-imminent-${Date.now()}`,
      type: 'task',
      title: task.title,
      courseName: course?.name || 'Materia Universitaria',
      dueDate: task.dueDate || new Date().toISOString().split('T')[0],
      dueTime: task.dueTime || 'En breve',
      minutesRemaining,
      description: task.description || `Esta entrega prioritaria vence en ${minutesRemaining} minutos. Puedes arrancar una sesión de foco inmediata o pedirle al agente que la aplace sin choques.`,
      priority: task.priority || 'alta',
      targetTaskId: task.id,
    };

    this.imminentAlert.set(alertItem);
  }

  triggerTestImminentAlert(targetTask?: Task): void {
    const tasks = this.tasks();
    const taskToAlert = targetTask || tasks.find((t) => t.status !== 'completed') || tasks[0];
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const dueTimeStr = `${h}:${m}`;

    const taskWithTime: Task = taskToAlert ? {
      ...taskToAlert,
      dueTime: dueTimeStr,
      dueDate: new Date().toISOString().split('T')[0],
    } : {
      id: `task-sample-${Date.now()}`,
      title: 'Guía de Ejercicios de Termodinámica & Laboratorio',
      courseId: this.courses()[0]?.id || 'c1',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: dueTimeStr,
      priority: 'alta',
      status: 'pending',
      estimatedMinutes: 60,
      eisenhowerQuadrant: 'urgente-importante',
      createdAt: new Date().toISOString(),
      subtasks: [],
    };

    this.triggerImminentAlert(taskWithTime, 10);
  }

  closeImminentAlert(): void {
    this.imminentAlert.set(null);
  }

  postponeAndRebalanceTask(
    taskId: string,
    postponeHours: number,
    customDate?: string,
    customTime?: string
  ): { success: boolean; message: string; relocatedCount: number; newSlot: string } {
    const task = this.tasks().find((t) => t.id === taskId);
    if (!task) {
      return { success: false, message: 'Tarea no encontrada.', relocatedCount: 0, newSlot: '' };
    }

    const courses = this.courses();
    let currentBlocks = [...this.timeBlocks()];
    let relocatedCount = 0;

    // Calculate new target date and time
    let targetDate = customDate;
    let targetTime = customTime;

    if (!targetDate || !targetTime) {
      const baseDate = new Date();
      baseDate.setHours(baseDate.getHours() + postponeHours);
      targetDate = baseDate.toISOString().split('T')[0];
      const h = baseDate.getHours().toString().padStart(2, '0');
      const m = baseDate.getMinutes().toString().padStart(2, '0');
      targetTime = `${h}:${m}`;
    }

    // Determine target day of week (0..6)
    const [y, m, d] = targetDate.split('-').map(Number);
    const targetDayOfWeek = new Date(y, m - 1, d).getDay();

    const parseMins = (t: string) => {
      if (!t) return 0;
      const [hours, mins] = t.split(':').map(Number);
      return (hours || 0) * 60 + (mins || 0);
    };

    const taskStartMins = parseMins(targetTime);
    const taskEndMins = taskStartMins + (task.estimatedMinutes || 60);

    // 1. Check if new target time collides with enrolled university classes
    courses.forEach((course) => {
      course.timeSlots.forEach((slot) => {
        if (slot.dayOfWeek === targetDayOfWeek) {
          const classStart = parseMins(slot.startTime);
          const classEnd = parseMins(slot.endTime);

          if (taskStartMins < classEnd && taskEndMins > classStart) {
            // Adjust task time after class ends to prevent class collision
            const safeStartHour = Math.floor((classEnd + 15) / 60);
            const safeStartMin = (classEnd + 15) % 60;
            targetTime = `${safeStartHour.toString().padStart(2, '0')}:${safeStartMin.toString().padStart(2, '0')}`;
          }
        }
      });
    });

    // 2. Check and re-accommodate existing study blocks on that day so they don't collide
    const updatedTaskStartMins = parseMins(targetTime);
    const updatedTaskEndMins = updatedTaskStartMins + (task.estimatedMinutes || 60);

    currentBlocks = currentBlocks.map((block) => {
      if (block.dayOfWeek === targetDayOfWeek) {
        const bStart = parseMins(block.startTime);
        const bEnd = parseMins(block.endTime);

        if (bStart < updatedTaskEndMins && bEnd > updatedTaskStartMins) {
          relocatedCount++;
          // Move conflicting study block to an open evening slot (e.g. 19:30 - 21:00)
          return {
            ...block,
            startTime: '19:30',
            endTime: '21:00',
            isAiSuggested: true,
            notes: `Reacomodado automáticamente por el Agente para dar espacio al aplazamiento de "${task.title}".`,
          };
        }
      }
      return block;
    });

    // 3. Update the task deadline
    this.updateTask({
      ...task,
      dueDate: targetDate,
      dueTime: targetTime,
    });

    // 4. Update timeBlocks with the re-accommodated schedule
    this.timeBlocks.set(currentBlocks);
    this.closeImminentAlert();

    const newSlotDesc = `${targetDate} a las ${targetTime}`;
    const msg = relocatedCount > 0
      ? `Tarea aplazada para el ${newSlotDesc}. El Agente reacomodó automáticamente ${relocatedCount} bloque(s) de estudio para evitar choques de horario.`
      : `Tarea aplazada con éxito para el ${newSlotDesc}. Horario libre sin conflictos con clases ni tareas.`;

    return {
      success: true,
      message: msg,
      relocatedCount,
      newSlot: newSlotDesc,
    };
  }

  // Insert entity extracted by Multi-Agent Collaborative System
  insertExtractedEntity(entity: ExtractedAcademicEntity): void {
    const courseId = entity.matchedCourseId || this.courses()[0]?.id || 'c1';

    if (entity.tipo === 'Examen') {
      const newExam: Exam = {
        id: `ex-multi-${Date.now()}`,
        courseId,
        title: entity.titulo,
        date: entity.fecha_entrega,
        time: entity.hora_entrega || '08:00',
        weightPercentage: entity.ponderacion || 25,
        topics: entity.descripcion_corta,
        difficulty: entity.prioridad === 'alta' ? 'alta' : entity.prioridad === 'media' ? 'media' : 'baja',
        status: 'upcoming',
      };
      this.exams.update((prev) => [newExam, ...prev]);
      this.currentTab.set('exams');
    } else {
      const newTask: Task = {
        id: `task-multi-${Date.now()}`,
        courseId,
        title: entity.titulo,
        description: entity.descripcion_corta,
        dueDate: entity.fecha_entrega,
        dueTime: entity.hora_entrega || '23:59',
        priority: entity.prioridad,
        eisenhowerQuadrant: entity.prioridad === 'alta' ? 'urgente-importante' : 'no-urgente-importante',
        status: 'pending',
        estimatedMinutes: entity.requiere_tiempo_estimado_minutos || 60,
        subtasks: [],
        createdAt: new Date().toISOString(),
      };
      this.tasks.update((prev) => [newTask, ...prev]);
      this.currentTab.set('tasks');
    }

    this.isMultiAgentHubOpen.set(false);
  }

  // Import Backup
  importBackup(backupData: any): void {
    if (backupData.courses) this.courses.set(backupData.courses);
    if (backupData.exams) this.exams.set(backupData.exams);
    if (backupData.tasks) this.tasks.set(backupData.tasks);
    if (backupData.timeBlocks) this.timeBlocks.set(backupData.timeBlocks);
    if (backupData.focusSessions) this.focusSessions.set(backupData.focusSessions);
  }
}

