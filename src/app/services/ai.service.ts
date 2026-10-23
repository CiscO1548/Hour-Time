import { Injectable } from '@angular/core';
import {
  Course,
  Exam,
  Task,
  StudentPreferences,
  AiSchedulePlan,
  ExamAIBreakdown,
  AiCoachDiagnostic,
  ConflictResolutionResult,
  CognitiveAdaptationResult,
  CommuteAnalysisResult,
  MultiAgentProcessingResult,
  FlashcardDeck,
} from '../../types';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  async optimizeSchedule(
    courses: Course[],
    exams: Exam[],
    tasks: Task[],
    studentPreferences: {
      chronotype: string;
      targetStudyHoursDaily: number;
      preferredMethod: string;
    }
  ): Promise<AiSchedulePlan> {
    const response = await fetch('/api/ai/optimize-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courses: courses.map((c) => ({
          name: c.name,
          code: c.code,
          timeSlots: c.timeSlots,
        })),
        exams: exams.filter((e) => e.status === 'upcoming'),
        tasks: tasks.filter((t) => t.status !== 'completed'),
        studentPreferences,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error en el servidor de IA' }));
      throw new Error(err.error || 'Error al optimizar horario con IA');
    }
    return response.json();
  }

  async breakdownExam(exam: {
    examTitle: string;
    courseName: string;
    examDate: string;
    topics?: string;
    difficulty?: string;
  }): Promise<ExamAIBreakdown> {
    const response = await fetch('/api/ai/breakdown-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error en el servidor de IA' }));
      throw new Error(err.error || 'Error al desglosar examen con IA');
    }
    return response.json();
  }

  async breakdownTask(rawText: string, courseList: string[]): Promise<any> {
    const response = await fetch('/api/ai/breakdown-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText, courseList }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error en el servidor de IA' }));
      throw new Error(err.error || 'Error al procesar tarea con IA');
    }
    return response.json();
  }

  async getAcademicCoachDiagnostic(
    stats: {
      totalStudyHours: string;
      completedTasks: number;
      totalTasks: number;
      focusSessionsCount: number;
      streakDays: number;
    },
    courses: { name: string; code: string }[],
    pendingTasksCount: number,
    upcomingExamsCount: number
  ): Promise<AiCoachDiagnostic> {
    const response = await fetch('/api/ai/academic-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stats,
        courses,
        pendingTasksCount,
        upcomingExamsCount,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error en el servidor de IA' }));
      throw new Error(err.error || 'Error al generar coaching con IA');
    }
    return response.json();
  }

  async resolveScheduleConflicts(payload: {
    incomingEvent?: {
      type: string;
      title: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      notes?: string;
    };
    courses: Course[];
    timeBlocks: any[];
    exams: Exam[];
    studentPreferences: any;
  }): Promise<ConflictResolutionResult> {
    const response = await fetch('/api/ai/resolve-conflicts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error al resolver conflictos con IA' }));
      throw new Error(err.error || 'Error en el agente de resolución de conflictos');
    }
    return response.json();
  }

  async adaptCognitiveRoutines(payload: {
    courses: Course[];
    timeBlocks: any[];
    focusSessions: any[];
    studentPreferences: any;
  }): Promise<CognitiveAdaptationResult> {
    const response = await fetch('/api/ai/adapt-routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error al adaptar rutinas cognitivas con IA' }));
      throw new Error(err.error || 'Error en el motor de adaptación de rutinas');
    }
    return response.json();
  }

  async analyzeCommuteTraffic(payload: {
    courses: Course[];
    customOrigin?: string;
    customDestination?: string;
    departureTime?: string;
  }): Promise<CommuteAnalysisResult> {
    const response = await fetch('/api/ai/analyze-commute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error al calcular traslados con Google Maps' }));
      throw new Error(err.error || 'Error en el analizador de traslados');
    }
    return response.json();
  }

  async processEmailWithMultiAgents(payload: {
    rawEmail: string;
    emailSubject?: string;
    courses: Course[];
    existingTasks: Task[];
    existingExams: Exam[];
  }): Promise<MultiAgentProcessingResult> {
    const response = await fetch('/api/ai/multi-agent-email-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error en el procesamiento multi-agente del correo' }));
      throw new Error(err.error || 'Error en el equipo multi-agente');
    }
    return response.json();
  }

  async generateFlashcards(courseName: string, topic?: string): Promise<FlashcardDeck> {
    const response = await fetch('/api/ai/generate-flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseName, topic }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error al generar flashcards de repaso' }));
      throw new Error(err.error || 'Error al generar tarjetas de repaso activo');
    }
    return response.json();
  }
}

