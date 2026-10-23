import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../services/cronos-state.service';
import { IconComponent } from '../icon/icon.component';
import { CourseDocument, DocumentChatMessage } from '../../../types';

@Component({
  selector: 'app-course-document-chat-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './course-document-chat-modal.component.html',
})
export class CourseDocumentChatModalComponent {
  readonly state = inject(CronosStateService);

  readonly selectedDocId = signal<string>(
    this.state.documentChatTargetDocId() || this.state.courseDocuments()[0]?.id || 'doc1'
  );

  readonly messages = signal<DocumentChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: '¡Hola! He analizado el documento académico. Puedes preguntarme sobre las fechas clave, los temas de cada semana, o pedirme que extraiga las tareas directamente a tu planificador.',
      timestamp: 'Ahora',
    },
  ]);

  readonly inputQuery = signal<string>('');
  readonly isThinking = signal<boolean>(false);
  readonly isUploading = signal<boolean>(false);

  readonly activeDoc = computed(() =>
    this.state.courseDocuments().find((d) => d.id === this.selectedDocId()) ||
    this.state.courseDocuments()[0]
  );

  readonly suggestedPrompts = [
    '¿Qué temas entran en el examen parcial?',
    'Extraer todas las fechas clave del sílabo',
    '¿Cuáles son las tareas obligatorias y su ponderación?',
    'Resumir el sílabo en 3 puntos clave',
  ];

  selectDoc(docId: string): void {
    this.selectedDocId.set(docId);
    this.messages.set([
      {
        id: `m-init-${Date.now()}`,
        sender: 'ai',
        text: `He cargado "${this.activeDoc()?.fileName}". ¿En qué puedo orientarte sobre este documento?`,
        timestamp: 'Ahora',
      },
    ]);
  }

  sendQuery(customText?: string): void {
    const text = (customText || this.inputQuery()).trim();
    if (!text) return;

    this.messages.update((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: 'Ahora',
      },
    ]);
    this.inputQuery.set('');
    this.isThinking.set(true);

    setTimeout(() => {
      const reply = this.generateAiReply(text, this.activeDoc());
      this.messages.update((prev) => [...prev, reply]);
      this.isThinking.set(false);
    }, 800);
  }

  handleImportDates(): void {
    const doc = this.activeDoc();
    if (!doc || !doc.keyDates) return;

    let count = 0;
    doc.keyDates.forEach((kd) => {
      if (kd.type === 'exam') {
        this.state.exams.update((prev) => [
          {
            id: `ex-doc-${Date.now()}-${count}`,
            courseId: doc.courseId,
            title: kd.title,
            date: kd.date,
            time: '09:00',
            weightPercentage: 25,
            difficulty: 'alta',
            status: 'upcoming',
            topics: `Extraído automáticamente del sílabo ${doc.fileName}`,
          },
          ...prev,
        ]);
        count++;
      } else {
        this.state.tasks.update((prev) => [
          {
            id: `task-doc-${Date.now()}-${count}`,
            courseId: doc.courseId,
            title: kd.title,
            dueDate: kd.date,
            priority: 'alta',
            eisenhowerQuadrant: 'urgente-importante',
            status: 'pending',
            estimatedMinutes: 90,
            subtasks: [],
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        count++;
      }
    });

    this.state.awardXp(120, `Fechas del sílabo "${doc.fileName}" sincronizadas al calendario`);
    this.state.addNotification({
      id: `notif-doc-${Date.now()}`,
      title: '📅 Sílabo Sincronizado',
      message: `Se importaron ${count} hitos y entregas a tu calendario y tareas.`,
      type: 'exam',
      timestamp: new Date().toISOString(),
      read: false,
    });

    this.messages.update((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'ai',
        text: `✓ ¡Listo! He añadido las ${count} fechas clave a tu sección de Clases, Exámenes y Tareas.`,
        timestamp: 'Ahora',
      },
    ]);
  }

  handleSimulateUpload(): void {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.pdf,.doc,.docx,.txt';
    inp.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        this.isUploading.set(true);
        setTimeout(() => {
          const newDoc: CourseDocument = {
            id: `doc-${Date.now()}`,
            courseId: this.state.courses()[0]?.id || 'c1',
            courseName: this.state.courses()[0]?.name || 'Materia Universitaria',
            fileName: file.name,
            fileSize: `${Math.round((file.size / 1024 / 1024) * 10) / 10 || 1.2} MB`,
            uploadedAt: new Date().toISOString().split('T')[0],
            summary: `Documento "${file.name}" procesado e indexado con éxito por el motor semántico de Cronos AI.`,
            keyDates: [
              { title: `Evaluación de ${file.name.replace('.pdf', '')}`, date: '2026-09-10', type: 'exam' },
              { title: `Entrega Práctica ${file.name.replace('.pdf', '')}`, date: '2026-09-02', type: 'task' },
            ],
            syllabusTopics: [
              'Fundamentos teóricos y definiciones',
              'Casos de estudio y problemas prácticos',
              'Rúbrica de evaluación y entregables',
            ],
          };
          this.state.addCourseDocument(newDoc);
          this.selectedDocId.set(newDoc.id);
          this.isUploading.set(false);
        }, 1000);
      }
    };
    inp.click();
  }

  close(): void {
    this.state.closeDocumentChat();
  }

  private generateAiReply(query: string, doc?: CourseDocument): DocumentChatMessage {
    const q = query.toLowerCase();
    const docName = doc?.fileName || 'Sílabo';

    if (q.includes('fecha') || q.includes('parcial') || q.includes('examen') || q.includes('entrega')) {
      return {
        id: `rep-${Date.now()}`,
        sender: 'ai',
        text: `Basado en **${docName}**, las fechas clave programadas son:\n\n` +
          (doc?.keyDates.map((k) => `• **${k.title}**: ${k.date} (${k.type === 'exam' ? 'Examen' : 'Tarea'})`).join('\n') ||
          '• Examen Parcial: Semana 8\n• Examen Final: Semana 16'),
        timestamp: 'Ahora',
        referencedPages: 'Página 2, Sección Cronograma',
      };
    }

    if (q.includes('resum') || q.includes('punto')) {
      return {
        id: `rep-${Date.now()}`,
        sender: 'ai',
        text: `📌 **Resumen Ejecutivo de ${docName}**:\n\n1. **Objetivo:** Desarrollar competencias avanzadas en ${doc?.courseName || 'el curso'}.\n2. **Estructura:** Comprende 4 módulos principales con clases teóricas y laboratorios.\n3. **Criterio de Aprobación:** Promedio ponderado mínimo de 11.5/20 con asistencia mayor al 70%.`,
        timestamp: 'Ahora',
        referencedPages: 'Página 1, Introducción y Competencias',
      };
    }

    return {
      id: `rep-${Date.now()}`,
      sender: 'ai',
      text: `Analizando **${docName}**: En relación a tu consulta sobre "*${query}*", el documento establece que este contenido se desarrolla mediante lecturas dirigidas y talleres aplicados. Te recomiendo programar un bloque de 50 minutos con la técnica Pomodoro para dominar este tema.`,
      timestamp: 'Ahora',
      referencedPages: 'Página 3-4',
    };
  }
}
