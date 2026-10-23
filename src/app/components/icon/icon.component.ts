import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.class]="class"
      [attr.viewBox]="viewBox"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      [ngSwitch]="name"
    >
      <!-- Clock -->
      <g *ngSwitchCase="'clock'">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </g>

      <!-- Sparkles -->
      <g *ngSwitchCase="'sparkles'">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" />
        <path d="M19 17v4" />
        <path d="M3 5h4" />
        <path d="M17 19h4" />
      </g>

      <!-- Flame -->
      <g *ngSwitchCase="'flame'">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </g>

      <!-- Volume2 -->
      <g *ngSwitchCase="'volume-2'">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </g>

      <!-- VolumeX -->
      <g *ngSwitchCase="'volume-x'">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="22" x2="16" y1="9" y2="15" />
        <line x1="16" x2="22" y1="9" y2="15" />
      </g>

      <!-- Calendar -->
      <g *ngSwitchCase="'calendar'">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </g>

      <!-- CalendarDays -->
      <g *ngSwitchCase="'calendar-days'">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
        <path d="M8 18h.01" />
        <path d="M12 18h.01" />
        <path d="M16 18h.01" />
      </g>

      <!-- Plus -->
      <g *ngSwitchCase="'plus'">
        <line x1="12" x2="12" y1="5" y2="19" />
        <line x1="5" x2="19" y1="12" y2="12" />
      </g>

      <!-- Bell -->
      <g *ngSwitchCase="'bell'">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </g>

      <!-- CheckCircle2 -->
      <g *ngSwitchCase="'check-circle-2'">
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </g>

      <!-- CheckCircle -->
      <g *ngSwitchCase="'check-circle'">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </g>

      <!-- AlertCircle -->
      <g *ngSwitchCase="'alert-circle'">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </g>

      <!-- AlertTriangle -->
      <g *ngSwitchCase="'alert-triangle'">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" x2="12" y1="9" y2="13" />
        <line x1="12" x2="12.01" y1="17" y2="17" />
      </g>

      <!-- BookOpen -->
      <g *ngSwitchCase="'book-open'">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </g>

      <!-- LayoutDashboard -->
      <g *ngSwitchCase="'layout-dashboard'">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </g>

      <!-- CheckSquare -->
      <g *ngSwitchCase="'check-square'">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </g>

      <!-- GraduationCap -->
      <g *ngSwitchCase="'graduation-cap'">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </g>

      <!-- Timer -->
      <g *ngSwitchCase="'timer'">
        <line x1="10" x2="14" y1="2" y2="2" />
        <line x1="12" x2="15" y1="14" y2="11" />
        <circle cx="12" cy="14" r="8" />
      </g>

      <!-- BarChart3 -->
      <g *ngSwitchCase="'bar-chart-3'">
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </g>

      <!-- Play -->
      <g *ngSwitchCase="'play'">
        <polygon points="5 3 19 12 5 21 5 3" />
      </g>

      <!-- Pause -->
      <g *ngSwitchCase="'pause'">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </g>

      <!-- RotateCcw -->
      <g *ngSwitchCase="'rotate-ccw'">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </g>

      <!-- SkipForward -->
      <g *ngSwitchCase="'skip-forward'">
        <polygon points="5 4 15 12 5 20 5 4" />
        <line x1="19" x2="19" y1="5" y2="19" />
      </g>

      <!-- Zap -->
      <g *ngSwitchCase="'zap'">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </g>

      <!-- Award -->
      <g *ngSwitchCase="'award'">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </g>

      <!-- ArrowRight -->
      <g *ngSwitchCase="'arrow-right'">
        <line x1="5" x2="19" y1="12" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </g>

      <!-- Trash2 -->
      <g *ngSwitchCase="'trash-2'">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" x2="10" y1="11" y2="17" />
        <line x1="14" x2="14" y1="11" y2="17" />
      </g>

      <!-- ExternalLink -->
      <g *ngSwitchCase="'external-link'">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" x2="21" y1="14" y2="3" />
      </g>

      <!-- Brain -->
      <g *ngSwitchCase="'brain'">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-4.04z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-4.04z" />
      </g>

      <!-- Star -->
      <g *ngSwitchCase="'star'">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </g>

      <!-- Search -->
      <g *ngSwitchCase="'search'">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" x2="16.65" y1="21" y2="16.65" />
      </g>

      <!-- List -->
      <g *ngSwitchCase="'list'">
        <line x1="8" x2="21" y1="6" y2="6" />
        <line x1="8" x2="21" y1="12" y2="12" />
        <line x1="8" x2="21" y1="18" y2="18" />
        <line x1="3" x2="3.01" y1="6" y2="6" />
        <line x1="3" x2="3.01" y1="12" y2="12" />
        <line x1="3" x2="3.01" y1="18" y2="18" />
      </g>

      <!-- LayoutGrid -->
      <g *ngSwitchCase="'layout-grid'">
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </g>

      <!-- ChevronDown -->
      <g *ngSwitchCase="'chevron-down'">
        <polyline points="6 9 12 15 18 9" />
      </g>

      <!-- ChevronUp -->
      <g *ngSwitchCase="'chevron-up'">
        <polyline points="18 15 12 9 6 15" />
      </g>

      <!-- Download -->
      <g *ngSwitchCase="'download'">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </g>

      <!-- Upload -->
      <g *ngSwitchCase="'upload'">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
      </g>

      <!-- Shield -->
      <g *ngSwitchCase="'shield'">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      </g>

      <!-- Target -->
      <g *ngSwitchCase="'target'">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </g>

      <!-- Coffee -->
      <g *ngSwitchCase="'coffee'">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" x2="6" y1="1" y2="4" />
        <line x1="10" x2="10" y1="1" y2="4" />
        <line x1="14" x2="14" y1="1" y2="4" />
      </g>

      <!-- Moon -->
      <g *ngSwitchCase="'moon'">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </g>

      <!-- Sun -->
      <g *ngSwitchCase="'sun'">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </g>

      <!-- Default circle fallback -->
      <g *ngSwitchDefault>
        <circle cx="12" cy="12" r="10" />
      </g>
    </svg>
  `,
})
export class IconComponent {
  @Input() name: string = '';
  @Input() class: string = 'w-4 h-4';
  @Input() strokeWidth: string | number = 2;
  @Input() viewBox: string = '0 0 24 24';
}
