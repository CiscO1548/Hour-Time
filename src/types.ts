export type PriorityLevel = 'alta' | 'media' | 'baja';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TabType = 'overview' | 'schedule' | 'tasks' | 'exams' | 'pomodoro' | 'analytics';
export type EisenhowerQuadrant =
  | 'urgente-importante'
  | 'no-urgente-importante'
  | 'urgente-no-importante'
  | 'no-urgente-no-importante';

export type StudyMethodType =
  | 'pomodoro_25_5'
  | 'pomodoro_50_10'
  | 'method_52_17'
  | 'time_blocking'
  | 'free_flow';

export interface ClassTimeSlot {
  id: string;
  dayOfWeek: number; // 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  startTime: string; // "09:00"
  endTime: string; // "11:00"
  room?: string;
  location?: string; // e.g. "Campus Central - Pabellón A", "Sede Norte", "Casa/Virtual"
}

export interface Course {
  id: string;
  name: string;
  code: string;
  color: string; // Hex or tailwind color
  professor?: string;
  classroom?: string;
  location?: string; // Campus / Sede
  credits?: number;
  timeSlots: ClassTimeSlot[];
  syllabusTopics?: string[];
}

export interface ExamMilestone {
  dayOffsetBeforeExam: number;
  title: string;
  durationMinutes: number;
  recommendedMethod: string;
  tasks: string[];
  selfAssessmentQuestion?: string;
}

export interface ExamAIBreakdown {
  studyStrategy: string;
  estimatedTotalHours: number;
  milestones: ExamMilestone[];
  quickCheckpoints: string[];
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "14:00"
  classroom?: string;
  weightPercentage?: number; // e.g. 30%
  topics?: string;
  difficulty: 'baja' | 'media' | 'alta';
  status: 'upcoming' | 'completed';
  aiBreakdown?: ExamAIBreakdown;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  courseId: string; // Can be course ID or "general"
  title: string;
  description?: string;
  dueDate: string; // "YYYY-MM-DD"
  dueTime?: string; // "23:59"
  priority: PriorityLevel;
  status: TaskStatus;
  estimatedMinutes: number;
  actualMinutes?: number;
  subtasks: SubTask[];
  eisenhowerQuadrant: EisenhowerQuadrant;
  createdAt: string;
  completedAt?: string;
  productivityTip?: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  courseId?: string;
  dayOfWeek: number; // 0..6
  startTime: string; // "16:00"
  endTime: string; // "17:30"
  type: 'class' | 'study' | 'break' | 'exam' | 'personal';
  technique?: string;
  priority?: PriorityLevel;
  notes?: string;
  isAiSuggested?: boolean;
}

export interface FocusSession {
  id: string;
  courseId?: string;
  taskId?: string;
  taskTitle?: string;
  method: StudyMethodType;
  durationMinutes: number;
  timestamp: string; // ISO String
  notes?: string;
  energyLevel: 1 | 2 | 3 | 4 | 5;
}

export interface StudentPreferences {
  chronotype: 'matutino' | 'vespertino' | 'nocturno' | 'intermedio';
  targetDailyHours: number;
  studyStreakDays?: number;
  defaultMethod?: StudyMethodType;
  notificationLeadMinutes?: number;
  soundEnabled: boolean;
  autoStartBreaks?: boolean;
  notificationsEnabled?: boolean;
  darkMode?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'exam' | 'task' | 'study_block' | 'system' | 'streak';
  timestamp: string;
  read: boolean;
  targetId?: string;
}

export interface AiSuggestedBlock {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  courseName: string;
  activityTitle: string;
  technique: string;
  priority: PriorityLevel;
  reason: string;
}

export interface AiSchedulePlan {
  summary: string;
  productivityScoreForecast: number;
  weeklyTips: string[];
  suggestedBlocks: AiSuggestedBlock[];
}

export interface AiCoachDiagnostic {
  diagnosticTitle: string;
  performanceBadge: string;
  analysis: string;
  strengthIdentified: string;
  areaToImprove: string;
  actionableSteps: string[];
  motivationalQuote: string;
}

export interface ScheduleConflictItem {
  id: string;
  type: 'class_overlap' | 'work_emergency' | 'task_deadline' | 'rescheduled_class';
  title: string;
  description: string;
  conflictingWithTitle: string;
  dayOfWeek: number;
  dayName: string;
  displacedTimeRange: string;
  severity: 'alta' | 'media' | 'baja';
}

export interface RelocatedBlockProposal {
  originalBlockId: string;
  title: string;
  courseName?: string;
  oldDayOfWeek: number;
  oldDayName: string;
  oldTimeRange: string;
  newDayOfWeek: number;
  newDayName: string;
  newStartTime: string;
  newEndTime: string;
  technique: string;
  reason: string;
  energyFit: string;
}

export interface ConflictResolutionResult {
  conflictsDetected: ScheduleConflictItem[];
  resolutionSummary: string;
  compensatedHours: number;
  relocations: RelocatedBlockProposal[];
  updatedTimeBlocks: TimeBlock[];
}

export interface ImminentAlertItem {
  id: string;
  type: 'task' | 'study_block' | 'exam';
  title: string;
  courseName?: string;
  dueDate: string;
  dueTime: string;
  minutesRemaining: number;
  description?: string;
  priority?: PriorityLevel;
  targetTaskId?: string;
  targetBlockId?: string;
}

export interface CognitivePeakInsight {
  subjectOrCategory: string;
  cognitiveDemand: 'alta' | 'media' | 'moderada';
  bestTimeOfDay: 'mañana' | 'tarde' | 'noche';
  bestTimeRange: string;
  efficiencyBoostPercentage: number;
  avgEnergyRating: number;
  insightExplanation: string;
}

export interface AdaptedRoutineProposal {
  blockId: string;
  activityTitle: string;
  courseName: string;
  cognitiveDemand: 'alta' | 'media' | 'moderada';
  oldSlot: string;
  newSlot: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface CognitiveAdaptationResult {
  detectedPeaks: CognitivePeakInsight[];
  overallCognitiveSummary: string;
  estimatedFocusGainPercentage: number;
  adaptedProposals: AdaptedRoutineProposal[];
  updatedTimeBlocks: TimeBlock[];
}

export interface CommuteValidationSegment {
  id: string;
  fromTitle: string;
  fromLocation: string;
  fromTime: string;
  toTitle: string;
  toLocation: string;
  toTime: string;
  dayOfWeek: number;
  dayName: string;
  gapMinutes: number;
  estimatedDurationMinutes: number;
  trafficCondition: 'fluido' | 'moderado' | 'pesado';
  trafficDelayMinutes: number;
  totalRequiredMinutes: number;
  status: 'safe' | 'tight' | 'critical';
  googleMapsUrl: string;
  agentAdvice: string;
}

export interface CommuteAnalysisResult {
  segments: CommuteValidationSegment[];
  summary: string;
  hasCriticalRisk: boolean;
  recommendedDepartureBufferMinutes: number;
}

export interface MultiAgentStepLog {
  agentRole: 'Extractor & Sanitizador' | 'Analista de Estructura Cognitiva' | 'Auditor & Coordinador de Negocio';
  agentName: string;
  agentAvatar: string;
  actionSummary: string;
  details: string;
  status: 'completed' | 'in_progress' | 'warning';
  timestamp: string;
}

export interface ExtractedAcademicEntity {
  tipo: 'Examen' | 'Tarea' | 'Proyecto' | 'Taller';
  curso: string;
  matchedCourseId?: string;
  titulo: string;
  fecha_entrega: string;
  hora_entrega?: string;
  descripcion_corta: string;
  prioridad: PriorityLevel;
  ponderacion?: number;
  requiere_tiempo_estimado_minutos?: number;
  conflicto_detectado?: {
    tieneConflicto: boolean;
    motivo?: string;
    solucionPropuesta?: string;
  };
}

export interface MultiAgentProcessingResult {
  steps: MultiAgentStepLog[];
  cleanedText: string;
  extractedEntity: ExtractedAcademicEntity;
  coordinationVerdict: string;
  readyToInsert: boolean;
}

export interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  category?: string;
  difficulty?: 'fácil' | 'media' | 'difícil';
}

export interface FlashcardDeck {
  courseName: string;
  topic: string;
  cards: FlashcardItem[];
  tipsForStudy: string;
}

// 1. AI EXAM SIMULATOR
export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  topicTag: string;
  selectedOptionId?: string;
  userIsCorrect?: boolean;
}

export interface ExamSimulationResult {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  difficulty: 'baja' | 'media' | 'alta';
  score: number; // 0 - 20 or 0 - 100
  totalQuestions: number;
  correctCount: number;
  timestamp: string;
  timeSpentSeconds: number;
  weakTopics: string[];
  recommendedStudyHours: number;
}

// 2. COURSE DOCUMENT & SYLLABUS CHAT
export interface CourseDocument {
  id: string;
  courseId: string;
  courseName: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  summary: string;
  keyDates: { title: string; date: string; type: 'exam' | 'task' }[];
  syllabusTopics: string[];
}

export interface DocumentChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  referencedPages?: string;
  suggestedAction?: {
    type: 'add_task' | 'add_exam' | 'add_study_block';
    payload: any;
  };
}

// 3. GAMIFICATION & ACADEMIC RPG
export interface SkillNode {
  id: string;
  courseId: string;
  name: string;
  description: string;
  levelRequired: number;
  unlocked: boolean;
  icon: string;
  xpCost: number;
  masteryPercent: number;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'focus' | 'streak' | 'grades' | 'ai';
  xpReward: number;
}

export interface AcademicRPGState {
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  title: string;
  badges: AchievementBadge[];
  courseXp: { [courseId: string]: number };
}

// 4. SMART VOICE MEMOS
export interface VoiceMemoNote {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  durationSeconds: number;
  recordedAt: string;
  transcription: string;
  summaryBulletPoints: string[];
  formulasDetected: string[];
  actionItems: string[];
  convertedToFlashcards?: boolean;
}
