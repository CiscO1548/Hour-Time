import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CronosStateService } from '../../services/cronos-state.service';
import { AudioService } from '../../services/audio.service';
import { SkillNode, AchievementBadge } from '../../../types';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-academic-rpg-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './academic-rpg-modal.component.html',
})
export class AcademicRpgModalComponent {
  readonly state = inject(CronosStateService);
  readonly audio = inject(AudioService);

  readonly activeTab = signal<'tree' | 'achievements'>('tree');
  readonly selectedCourseId = signal<string>('all');

  readonly filteredSkills = computed(() => {
    const courseId = this.selectedCourseId();
    const nodes = this.state.skillNodes();
    if (courseId === 'all') return nodes;
    return nodes.filter((n) => n.courseId === courseId);
  });

  readonly unlockedBadgesCount = computed(
    () => this.state.achievements().filter((a) => a.unlocked).length
  );

  unlockSkillNode(node: SkillNode): void {
    if (node.unlocked) return;
    if (this.state.totalXp() < node.xpCost) {
      alert(`Necesitas al menos ${node.xpCost} XP para desbloquear este nodo de habilidad.`);
      return;
    }

    this.state.unlockSkill(node.id);
    this.state.awardXp(50, `Habilidad desbloqueada: ${node.name}`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    if (this.state.preferences().soundEnabled) {
      this.audio.playCompletionChime();
    }
  }

  close(): void {
    this.state.closeAcademicRpg();
  }
}
