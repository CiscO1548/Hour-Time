import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../../services/cronos-state.service';
import { AiService } from '../../../services/ai.service';
import { IconComponent } from '../../icon/icon.component';
import { FlashcardDeck, FlashcardItem } from '../../../../types';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-flashcards-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './flashcards-modal.component.html',
})
export class FlashcardsModalComponent implements OnInit {
  readonly state = inject(CronosStateService);
  readonly ai = inject(AiService);

  readonly selectedCourse = signal<string>('');
  readonly selectedTopic = signal<string>('');
  readonly isGenerating = signal<boolean>(false);
  readonly deck = signal<FlashcardDeck | null>(null);
  readonly currentIndex = signal<number>(0);
  readonly isFlipped = signal<boolean>(false);
  readonly isCompleted = signal<boolean>(false);

  readonly scores = signal<{ easy: number; medium: number; hard: number }>({
    easy: 0,
    medium: 0,
    hard: 0,
  });

  ngOnInit(): void {
    this.selectedCourse.set(this.state.flashcardTargetCourse());
    this.selectedTopic.set(this.state.flashcardTargetTopic());
    this.loadDeck();
  }

  async loadDeck(): Promise<void> {
    this.isGenerating.set(true);
    this.currentIndex.set(0);
    this.isFlipped.set(false);
    this.isCompleted.set(false);
    this.scores.set({ easy: 0, medium: 0, hard: 0 });

    try {
      const course = this.selectedCourse() || this.state.courses()[0]?.name || 'Materia General';
      const topic = this.selectedTopic() || 'Conceptos clave de evaluación';
      const res = await this.ai.generateFlashcards(course, topic);
      this.deck.set(res);
    } catch (err) {
      console.error('Error generating flashcards:', err);
    } finally {
      this.isGenerating.set(false);
    }
  }

  flipCard(): void {
    this.isFlipped.update((v) => !v);
  }

  rateCard(rating: 'easy' | 'medium' | 'hard'): void {
    this.scores.update((s) => ({
      ...s,
      [rating]: s[rating] + 1,
    }));

    const currentDeck = this.deck();
    if (!currentDeck) return;

    if (this.currentIndex() < currentDeck.cards.length - 1) {
      this.isFlipped.set(false);
      setTimeout(() => {
        this.currentIndex.update((i) => i + 1);
      }, 150);
    } else {
      this.isCompleted.set(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  }

  restartDeck(): void {
    this.currentIndex.set(0);
    this.isFlipped.set(false);
    this.isCompleted.set(false);
    this.scores.set({ easy: 0, medium: 0, hard: 0 });
  }

  close(): void {
    this.state.closeFlashcards();
  }
}
