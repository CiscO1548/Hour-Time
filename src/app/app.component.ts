import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CronosStateService } from './services/cronos-state.service';
import { NavbarComponent } from './components/navbar/navbar.component';
import { TabsHeaderComponent } from './components/tabs-header/tabs-header.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { ScheduleViewComponent } from './components/schedule-view/schedule-view.component';
import { TasksViewComponent } from './components/tasks-view/tasks-view.component';
import { ExamsClassesViewComponent } from './components/exams-classes-view/exams-classes-view.component';
import { PomodoroTimerComponent } from './components/pomodoro-timer/pomodoro-timer.component';
import { AnalyticsViewComponent } from './components/analytics-view/analytics-view.component';
import { AiOptimizerModalComponent } from './components/modals/ai-optimizer-modal/ai-optimizer-modal.component';
import { QuickAddModalComponent } from './components/modals/quick-add-modal/quick-add-modal.component';
import { CalendarSyncModalComponent } from './components/modals/calendar-sync-modal/calendar-sync-modal.component';
import { ConflictResolverModalComponent } from './components/modals/conflict-resolver-modal/conflict-resolver-modal.component';
import { ImminentDeadlineModalComponent } from './components/modals/imminent-deadline-modal/imminent-deadline-modal.component';
import { CognitiveRoutineModalComponent } from './components/modals/cognitive-routine-modal/cognitive-routine-modal.component';
import { CommuteModalComponent } from './components/modals/commute-modal/commute-modal.component';
import { MultiAgentHubModalComponent } from './components/modals/multi-agent-hub-modal/multi-agent-hub-modal.component';
import { FlashcardsModalComponent } from './components/modals/flashcards-modal/flashcards-modal.component';
import { CommandPaletteComponent } from './components/command-palette/command-palette.component';
import { ExamSimulatorModalComponent } from './components/exam-simulator-modal/exam-simulator-modal.component';
import { CourseDocumentChatModalComponent } from './components/course-document-chat-modal/course-document-chat-modal.component';
import { AcademicRpgModalComponent } from './components/academic-rpg-modal/academic-rpg-modal.component';
import { VoiceMemoModalComponent } from './components/voice-memo-modal/voice-memo-modal.component';
import { FloatingPomodoroWidgetComponent } from './components/floating-pomodoro-widget/floating-pomodoro-widget.component';
import { PortfolioExportModalComponent } from './components/portfolio-export-modal/portfolio-export-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    TabsHeaderComponent,
    DashboardOverviewComponent,
    ScheduleViewComponent,
    TasksViewComponent,
    ExamsClassesViewComponent,
    PomodoroTimerComponent,
    AnalyticsViewComponent,
    AiOptimizerModalComponent,
    QuickAddModalComponent,
    CalendarSyncModalComponent,
    ConflictResolverModalComponent,
    ImminentDeadlineModalComponent,
    CognitiveRoutineModalComponent,
    CommuteModalComponent,
    MultiAgentHubModalComponent,
    FlashcardsModalComponent,
    CommandPaletteComponent,
    ExamSimulatorModalComponent,
    CourseDocumentChatModalComponent,
    AcademicRpgModalComponent,
    VoiceMemoModalComponent,
    FloatingPomodoroWidgetComponent,
    PortfolioExportModalComponent,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly state = inject(CronosStateService);
}
