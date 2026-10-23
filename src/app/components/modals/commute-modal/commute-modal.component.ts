import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../../services/cronos-state.service';
import { AiService } from '../../../services/ai.service';
import { IconComponent } from '../../icon/icon.component';
import { CommuteAnalysisResult, TimeBlock } from '../../../../types';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-commute-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './commute-modal.component.html',
})
export class CommuteModalComponent implements OnInit {
  readonly state = inject(CronosStateService);
  readonly ai = inject(AiService);

  readonly isLoading = signal<boolean>(false);
  readonly commuteResult = signal<CommuteAnalysisResult | null>(null);

  originLocation = 'Campus Central - Pabellón A (Av. Universitaria)';
  destinationLocation = 'Sede San Isidro - Laboratorio Central de Física';
  departureTime = '09:30';
  isCustomRoute = signal<boolean>(false);

  ngOnInit(): void {
    this.handleAnalyzeCommute();
  }

  close(): void {
    this.state.isCommuteModalOpen.set(false);
  }

  async handleAnalyzeCommute(): Promise<void> {
    try {
      this.isLoading.set(true);
      const courses = this.state.courses();

      const result = await this.ai.analyzeCommuteTraffic({
        courses,
        customOrigin: this.originLocation,
        customDestination: this.destinationLocation,
        departureTime: this.departureTime,
      });

      this.commuteResult.set(result);
    } catch (e: any) {
      alert(`Error al calcular traslado: ${e.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  handleOpenGoogleMaps(url: string): void {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  handleAddCommuteBufferBlock(): void {
    const res = this.commuteResult();
    if (!res || res.segments.length === 0) return;

    const seg = res.segments[0];
    const newBufferBlock: Omit<TimeBlock, 'id'> = {
      type: 'personal',
      courseId: 'commute-buffer',
      title: `🚗 Traslado: ${seg.fromLocation.split('-')[0].trim()} ➔ ${seg.toLocation.split('-')[0].trim()}`,
      dayOfWeek: seg.dayOfWeek,
      startTime: seg.fromTime,
      endTime: seg.toTime,
      technique: 'time_blocking',
      priority: 'media',
      isAiSuggested: true,
      notes: `Buffer de traslado con tráfico considerado (+${seg.trafficDelayMinutes} min). Validado con Google Maps.`,
    };

    this.state.applySuggestedBlocks([newBufferBlock]);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    this.close();
  }
}
