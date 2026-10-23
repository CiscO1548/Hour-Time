import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../../services/cronos-state.service';
import { AiService } from '../../../services/ai.service';
import { IconComponent } from '../../icon/icon.component';
import { PriorityLevel, EisenhowerQuadrant } from '../../../../types';

@Component({
  selector: 'app-quick-add-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './quick-add-modal.component.html',
})
export class QuickAddModalComponent {
  readonly state = inject(CronosStateService);
  readonly ai = inject(AiService);

  readonly activeType = signal<'ai_quick' | 'task' | 'exam' | 'course' | 'block'>('ai_quick');

  // AI Quick state
  aiText = '';
  readonly isAiLoading = signal<boolean>(false);

  // Task form
  taskTitle = '';
  taskCourseId = this.state.courses()[0]?.id || 'general';
  taskDueDate = new Date().toISOString().split('T')[0];
  taskDueTime = '23:59';
  taskPriority: PriorityLevel = 'alta';
  taskEstimatedMin = 60;
  taskQuadrant: EisenhowerQuadrant = 'urgente-importante';
  taskDesc = '';

  // Exam form
  examTitle = '';
  examCourseId = this.state.courses()[0]?.id || '';
  examDate = new Date().toISOString().split('T')[0];
  examTime = '09:00';
  examClassroom = '';
  examWeight = 25;
  examDifficulty: 'baja' | 'media' | 'alta' = 'alta';
  examTopics = '';

  // Course form
  courseName = '';
  courseCode = '';
  courseColor = '#3b82f6';
  courseProfessor = '';
  courseRoom = '';

  // Study Block form
  blockTitle = 'Bloque de Estudio Profundo';
  blockDay = 1;
  blockStart = '16:00';
  blockEnd = '17:30';
  blockTechnique = 'Pomodoro 50/10';

  close(): void {
    this.state.isQuickAddOpen.set(false);
  }

  async handleAiProcess(): Promise<void> {
    if (!this.aiText.trim()) return;
    try {
      this.isAiLoading.set(true);
      const courses = this.state.courses();
      const data = await this.ai.breakdownTask(
        this.aiText,
        courses.map((c) => c.name)
      );

      const matchedCourse = courses.find((c) =>
        data.courseName && c.name.toLowerCase().includes(data.courseName.toLowerCase())
      );

      const subtasks = (data.subtasks || []).map((st: string, idx: number) => ({
        id: `ai-st-${Date.now()}-${idx}`,
        title: st,
        completed: false,
      }));

      this.state.addTask({
        title: data.title || this.aiText,
        courseId: matchedCourse?.id || 'general',
        dueDate: data.suggestedDueDate || new Date().toISOString().split('T')[0],
        dueTime: '23:59',
        priority: data.priority || 'alta',
        status: 'pending',
        estimatedMinutes: data.estimatedMinutes || 60,
        subtasks,
        eisenhowerQuadrant: data.eisenhowerQuadrant || 'urgente-importante',
        description: this.aiText,
        productivityTip: data.productivityTip,
      });

      this.close();
    } catch (e: any) {
      alert(`No se pudo procesar con IA: ${e.message}`);
    } finally {
      this.isAiLoading.set(false);
    }
  }

  handleCreateTask(e: Event): void {
    e.preventDefault();
    if (!this.taskTitle.trim()) return;
    this.state.addTask({
      title: this.taskTitle.trim(),
      courseId: this.taskCourseId,
      dueDate: this.taskDueDate,
      dueTime: this.taskDueTime,
      priority: this.taskPriority,
      status: 'pending',
      estimatedMinutes: this.taskEstimatedMin,
      subtasks: [],
      eisenhowerQuadrant: this.taskQuadrant,
      description: this.taskDesc,
    });
    this.close();
  }

  handleCreateExam(e: Event): void {
    e.preventDefault();
    if (!this.examTitle.trim()) return;
    this.state.addExam({
      title: this.examTitle.trim(),
      courseId: this.examCourseId || this.state.courses()[0]?.id || 'general',
      date: this.examDate,
      time: this.examTime,
      classroom: this.examClassroom,
      weightPercentage: this.examWeight,
      difficulty: this.examDifficulty,
      topics: this.examTopics,
      status: 'upcoming',
    });
    this.close();
  }

  handleCreateCourse(e: Event): void {
    e.preventDefault();
    if (!this.courseName.trim()) return;
    this.state.addCourse({
      name: this.courseName.trim(),
      code: this.courseCode.trim() || 'GEN-101',
      color: this.courseColor,
      professor: this.courseProfessor,
      classroom: this.courseRoom,
      timeSlots: [
        {
          id: `ts-${Date.now()}`,
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '10:00',
          room: this.courseRoom,
        },
      ],
      syllabusTopics: [],
    });
    this.close();
  }

  handleCreateBlock(e: Event): void {
    e.preventDefault();
    this.state.addTimeBlock({
      title: this.blockTitle.trim(),
      dayOfWeek: Number(this.blockDay),
      startTime: this.blockStart,
      endTime: this.blockEnd,
      type: 'study',
      technique: this.blockTechnique,
      priority: 'alta',
    });
    this.close();
  }
}
