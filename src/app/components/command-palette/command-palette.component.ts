import { Component, inject, signal, computed, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../services/cronos-state.service';
import { IconComponent } from '../icon/icon.component';
import { TabType, Task, Course } from '../../../types';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Navegación' | 'Acciones IA' | 'Materias' | 'Tareas';
  description?: string;
  icon: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './command-palette.component.html',
})
export class CommandPaletteComponent {
  readonly state = inject(CronosStateService);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  readonly query = signal<string>('');
  readonly selectedIndex = signal<number>(0);

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    // Check for Ctrl+K or Cmd+K
    if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K')) {
      event.preventDefault();
      this.state.toggleCommandPalette();
      if (this.state.isCommandPaletteOpen()) {
        setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
      }
      return;
    }

    if (!this.state.isCommandPaletteOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const max = this.filteredCommands().length;
      if (max > 0) {
        this.selectedIndex.update((i) => (i + 1) % max);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const max = this.filteredCommands().length;
      if (max > 0) {
        this.selectedIndex.update((i) => (i - 1 + max) % max);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const list = this.filteredCommands();
      const item = list[this.selectedIndex()];
      if (item) {
        item.action();
        this.close();
      }
    }
  }

  readonly allCommands = computed<CommandItem[]>(() => {
    const commands: CommandItem[] = [
      // 1. Navigation
      {
        id: 'nav-overview',
        title: 'Panel General (Dashboard)',
        category: 'Navegación',
        description: 'Vista general de tareas, exámenes y métricas',
        icon: 'layout-dashboard',
        action: () => this.state.setTab('overview'),
      },
      {
        id: 'nav-schedule',
        title: 'Horario Semanal & Time Blocking',
        category: 'Navegación',
        description: 'Ver cuadrícula semanal y bloques de estudio',
        icon: 'calendar',
        action: () => this.state.setTab('schedule'),
      },
      {
        id: 'nav-tasks',
        title: 'Tareas & Entregas (Matriz Eisenhower)',
        category: 'Navegación',
        description: 'Gestionar tareas urgentes e importantes',
        icon: 'check-square',
        action: () => this.state.setTab('tasks'),
      },
      {
        id: 'nav-exams',
        title: 'Clases & Exámenes',
        category: 'Navegación',
        description: 'Planes de estudio y cursos matriculados',
        icon: 'graduation-cap',
        action: () => this.state.setTab('exams'),
      },
      {
        id: 'nav-pomodoro',
        title: 'Modo Foco & Pomodoro',
        category: 'Navegación',
        description: 'Temporizador con neuroaprendizaje y descansos',
        icon: 'clock',
        action: () => this.state.setTab('pomodoro'),
      },
      {
        id: 'nav-analytics',
        title: 'Analíticas & Coach IA',
        category: 'Navegación',
        description: 'Diagnósticos de rendimiento y hábitos',
        icon: 'bar-chart-2',
        action: () => this.state.setTab('analytics'),
      },

      // 2. AI Actions & Tools
      {
        id: 'ai-exam-simulator',
        title: '🤖 Simulador de Exámenes y Quizzes con IA',
        category: 'Acciones IA',
        description: 'Generar prueba interactiva con calificación y feedback',
        icon: 'sparkles',
        action: () => this.state.openExamSimulator(),
      },
      {
        id: 'ai-doc-chat',
        title: '📄 Chat con Sílabos & Documentos PDF',
        category: 'Acciones IA',
        description: 'Consultar dudas y extraer fechas de entrega del sílabo',
        icon: 'sparkles',
        action: () => this.state.openDocumentChat(),
      },
      {
        id: 'rpg-skills',
        title: '🎮 Árbol de Habilidades & Nivel Académico (XP)',
        category: 'Acciones IA',
        description: 'Ver rango, medallas conseguidas y desbloquear habilidades',
        icon: 'award',
        action: () => this.state.openAcademicRpg(),
      },
      {
        id: 'voice-memo',
        title: '🎙️ Grabar Nota de Voz & Resumen IA',
        category: 'Acciones IA',
        description: 'Transcribir audio de clase y extraer fórmulas/tareas',
        icon: 'volume-2',
        action: () => this.state.openVoiceMemo(),
      },
      {
        id: 'floating-widget',
        title: '🪟 Widget Flotante del Temporizador Pomodoro',
        category: 'Acciones IA',
        description: 'Activar mini-player Picture-in-Picture en pantalla',
        icon: 'timer',
        action: () => this.state.toggleFloatingWidget(true),
      },
      {
        id: 'portfolio-export',
        title: '📊 Generar Dossier y Portafolio PDF',
        category: 'Acciones IA',
        description: 'Exportar informe consolidado de notas y horas de estudio',
        icon: 'bar-chart-2',
        action: () => this.state.openPortfolioExport(),
      },
      {
        id: 'ai-optimizer',
        title: 'Optimizar Horario Semanal con IA',
        category: 'Acciones IA',
        description: 'Generar plan de estudio semanal 0 choques',
        icon: 'sparkles',
        action: () => this.state.isAiOptimizerOpen.set(true),
      },
      {
        id: 'ai-flashcards',
        title: 'Flashcards & Repaso Activo IA (Active Recall 3D)',
        category: 'Acciones IA',
        description: 'Crear mazo de preguntas para repasar materias',
        icon: 'sparkles',
        action: () => this.state.openFlashcards(),
      },
      {
        id: 'ai-multi-agent',
        title: 'Multi-Agente de Correo Institucional',
        category: 'Acciones IA',
        description: 'Extraer tareas y fechas desde correos o avisos',
        icon: 'bot',
        action: () => this.state.isMultiAgentHubOpen.set(true),
      },
      {
        id: 'ai-conflict-resolver',
        title: 'Resolución de Conflictos e Imprevistos',
        category: 'Acciones IA',
        description: 'Ajustar horario ante clases reprogramadas',
        icon: 'alert-triangle',
        action: () => this.state.isConflictResolverOpen.set(true),
      },
      {
        id: 'ai-commute',
        title: 'Calcular Traslados con Google Maps',
        category: 'Acciones IA',
        description: 'Optimizar tiempos de viaje y tráfico entre sedes',
        icon: 'map-pin',
        action: () => this.state.isCommuteModalOpen.set(true),
      },
      {
        id: 'act-quick-add',
        title: 'Nueva Actividad / Tarea / Examen',
        category: 'Acciones IA',
        description: 'Registrar un nuevo elemento en Cronos',
        icon: 'plus',
        action: () => this.state.isQuickAddOpen.set(true),
      },
      {
        id: 'act-sync-calendar',
        title: 'Sincronizar con Google Calendar',
        category: 'Acciones IA',
        description: 'Exportar o importar horario universitario',
        icon: 'calendar',
        action: () => this.state.isCalendarSyncOpen.set(true),
      },
      {
        id: 'act-theme',
        title: 'Alternar Modo Oscuro / Claro',
        category: 'Acciones IA',
        description: 'Cambiar apariencia visual del sistema',
        icon: 'moon',
        action: () => this.state.toggleDarkMode(),
      },
    ];

    // 3. Courses
    this.state.courses().forEach((c) => {
      commands.push({
        id: `course-${c.id}`,
        title: `Materia: ${c.name} (${c.code})`,
        category: 'Materias',
        description: `Prof. ${c.professor || 'Docente'} • ${c.credits || 4} créditos`,
        icon: 'book-open',
        action: () => {
          this.state.openFlashcards(c.name);
        },
      });
    });

    // 4. Pending Tasks
    this.state
      .tasks()
      .filter((t) => t.status !== 'completed')
      .slice(0, 8)
      .forEach((task) => {
        commands.push({
          id: `task-${task.id}`,
          title: `Tarea: ${task.title}`,
          category: 'Tareas',
          description: `Vence: ${task.dueDate || 'Sin fecha'} • Prioridad ${task.priority}`,
          icon: 'check-circle-2',
          action: () => {
            this.state.startFocusWithTask(task);
          },
        });
      });

    return commands;
  });

  readonly filteredCommands = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.allCommands();

    return this.allCommands().filter((c) =>
      c.title.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q)
    );
  });

  handleSelect(item: CommandItem): void {
    item.action();
    this.close();
  }

  close(): void {
    this.query.set('');
    this.selectedIndex.set(0);
    this.state.isCommandPaletteOpen.set(false);
  }
}
