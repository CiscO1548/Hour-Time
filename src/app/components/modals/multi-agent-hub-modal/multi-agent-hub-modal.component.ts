import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../../services/cronos-state.service';
import { AiService } from '../../../services/ai.service';
import { IconComponent } from '../../icon/icon.component';
import { MultiAgentProcessingResult } from '../../../../types';
import confetti from 'canvas-confetti';
import { SocialAuthService, GoogleSigninButtonDirective, SocialUser } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-multi-agent-hub-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, GoogleSigninButtonDirective],
  templateUrl: './multi-agent-hub-modal.component.html',
})
export class MultiAgentHubModalComponent implements OnInit, OnDestroy {
  readonly state = inject(CronosStateService);
  readonly ai = inject(AiService);
  private authService = inject(SocialAuthService);

  readonly isProcessing = signal<boolean>(false);
  readonly multiAgentResult = signal<MultiAgentProcessingResult | null>(null);
  
  user: SocialUser | null = null;
  private authSubscription: any;

  // Simulate fetched emails from Gmail API for demonstration after OAuth
  readonly fetchedEmails = [
    {
      id: 'senati-1',
      subject: 'Recordatorio de Entrega - Proyecto Integrador de Software',
      body: `Estimados alumnos,\n\nLes recuerdo que el Proyecto Final tiene como fecha improrrogable de entrega el próximo viernes 28 de Agosto a las 23:59 horas.\n\nAtte. Senati`,
    },
    {
      id: 'senati-2',
      subject: 'Aviso urgente: Reprogramación Examen Parcial II',
      body: `Alumnos:\n\nEl Examen Parcial II se llevará a cabo el 26 de Agosto a las 08:30 horas en el Auditorio Central.\n\nAtte. Senati`,
    }
  ];

  ngOnInit(): void {
    // Escuchar el estado de autenticación de Google
    this.authSubscription = this.authService.authState.subscribe((user) => {
      this.user = user;
      if (user) {
        // Al conectar la cuenta, procesar automáticamente los correos más recientes de la bandeja
        this.handleExtractFromGmail();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  close(): void {
    this.state.isMultiAgentHubOpen.set(false);
  }

  signOut(): void {
    this.authService.signOut();
    this.user = null;
    this.multiAgentResult.set(null);
  }

  async handleExtractFromGmail(): Promise<void> {
    try {
      this.isProcessing.set(true);
      const courses = this.state.courses();
      const existingTasks = this.state.tasks();
      const existingExams = this.state.exams();

      // Tomamos el primer correo para la demostración de extracción
      const latestEmail = this.fetchedEmails[0];

      const result = await this.ai.processEmailWithMultiAgents({
        rawEmail: latestEmail.body,
        emailSubject: latestEmail.subject,
        courses,
        existingTasks,
        existingExams,
      });

      this.multiAgentResult.set(result);
    } catch (e: any) {
      alert(`Error en el sistema multi-agente: ${e.message}`);
    } finally {
      this.isProcessing.set(false);
    }
  }

  handleInsertToDatabase(): void {
    const res = this.multiAgentResult();
    if (!res || !res.extractedEntity) return;

    this.state.insertExtractedEntity(res.extractedEntity);
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
  }
}
