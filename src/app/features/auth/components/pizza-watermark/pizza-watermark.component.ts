import { Component, OnInit } from '@angular/core';

export interface WatermarkDoodle {
  type: 'pizza-full' | 'pizza-slice-1' | 'pizza-slice-2' | 'mushroom' | 'tomato' | 'basil' | 'olive' | 'pepper';
  top: number;
  left: number;
  rotation: number;
  scale: number;
  opacity: number;
  duration: number;
  delay: number;
}

@Component({
  selector: 'app-pizza-watermark',
  standalone: true,
  template: `
    <div class="random-watermark-container" aria-hidden="true">
      @for (item of doodles; track $index) {
        <div
          class="doodle-wrapper float-anim"
          [style.top.%]="item.top"
          [style.left.%]="item.left"
          [style.transform]="'rotate(' + item.rotation + 'deg) scale(' + item.scale + ')'"
          [style.opacity]="item.opacity"
          [style.animation-duration.s]="item.duration"
          [style.animation-delay.s]="item.delay"
        >
          @switch (item.type) {
            @case ('pizza-full') {
              <svg viewBox="0 0 100 100" class="doodle-svg">
                <circle cx="50" cy="50" r="42" stroke-dasharray="10 3" />
                <circle cx="50" cy="50" r="36" />
                <line x1="50" y1="14" x2="50" y2="86" />
                <line x1="14" y1="50" x2="86" y2="50" />
                <line x1="24" y1="24" x2="76" y2="76" />
                <line x1="76" y1="24" x2="24" y2="76" />
                <circle cx="38" cy="32" r="6" />
                <circle cx="65" cy="35" r="5" />
                <circle cx="32" cy="60" r="6" />
                <circle cx="62" cy="68" r="7" />
              </svg>
            }
            @case ('pizza-slice-1') {
              <svg viewBox="0 0 100 100" class="doodle-svg">
                <path d="M15 15 L85 40 L35 90 Z" />
                <path d="M82 36 C88 50, 45 92, 32 87" />
                <circle cx="42" cy="42" r="8" />
                <circle cx="60" cy="55" r="9" />
                <path d="M30 60 C26 52, 40 52, 36 60 Z" />
              </svg>
            }
            @case ('pizza-slice-2') {
              <svg viewBox="0 0 100 100" class="doodle-svg">
                <path d="M10 20 L90 35 L40 95 Z" />
                <path d="M86 31 C92 45, 45 97, 36 91" stroke-dasharray="4 3" />
                <circle cx="45" cy="45" r="7" />
                <circle cx="65" cy="50" r="8" />
                <circle cx="35" cy="70" r="5" />
              </svg>
            }
            @case ('mushroom') {
              <svg viewBox="0 0 60 60" class="doodle-svg sm">
                <path d="M10 30 C10 12, 50 12, 50 30 L42 30 L42 48 L18 48 L18 30 Z" />
                <circle cx="22" cy="22" r="3" />
                <circle cx="38" cy="20" r="4" />
              </svg>
            }
            @case ('tomato') {
              <svg viewBox="0 0 60 60" class="doodle-svg sm">
                <circle cx="30" cy="30" r="24" />
                <circle cx="30" cy="30" r="17" />
                <path d="M22 22 C24 18, 36 18, 38 22 Z" />
                <path d="M22 38 C24 42, 36 42, 38 38 Z" />
              </svg>
            }
            @case ('basil') {
              <svg viewBox="0 0 60 60" class="doodle-svg sm">
                <path d="M30 8 C15 22, 15 42, 30 52 C45 42, 45 22, 30 8 Z" />
                <line x1="30" y1="12" x2="30" y2="48" />
                <line x1="30" y1="24" x2="22" y2="20" />
                <line x1="30" y1="34" x2="38" y2="30" />
              </svg>
            }
            @case ('olive') {
              <svg viewBox="0 0 50 50" class="doodle-svg xs">
                <circle cx="25" cy="25" r="20" />
                <circle cx="25" cy="25" r="10" />
              </svg>
            }
            @case ('pepper') {
              <svg viewBox="0 0 60 60" class="doodle-svg sm">
                <path d="M15 15 Q30 8 45 15 Q52 30 45 45 Q30 52 15 45 Q8 30 15 15 Z" />
                <path d="M20 20 Q30 15 40 20 Q44 30 40 40 Q30 44 20 40 Q16 30 20 20 Z" />
              </svg>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .random-watermark-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
      overflow: hidden;
      user-select: none;
    }

    .doodle-wrapper {
      position: absolute;
      width: 130px;
      height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
    }

    .doodle-svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: rgba(40, 51, 39, 0.28);
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .doodle-svg.sm {
      width: 75px;
      height: 75px;
    }

    .doodle-svg.xs {
      width: 55px;
      height: 55px;
    }

    .float-anim {
      animation: randomDrift 16s ease-in-out infinite alternate;
    }

    @keyframes randomDrift {
      0% {
        transform: translate(0px, 0px) rotate(var(--rot, 0deg)) scale(1);
      }
      50% {
        transform: translate(-12px, -15px) rotate(calc(var(--rot, 0deg) + 6deg)) scale(1.04);
      }
      100% {
        transform: translate(10px, 12px) rotate(calc(var(--rot, 0deg) - 4deg)) scale(0.98);
      }
    }
  `]
})
export class PizzaWatermarkComponent implements OnInit {
  public doodles: WatermarkDoodle[] = [];

  ngOnInit() {
    this.generateRandomDoodles();
  }

  private generateRandomDoodles() {
    const types: WatermarkDoodle['type'][] = [
      'pizza-full', 'pizza-slice-1', 'pizza-slice-2',
      'mushroom', 'tomato', 'basil', 'olive', 'pepper'
    ];

    // Grid-seeded random positions across 5x5 grid (25 items) for complete screen coverage with organic randomness
    const cols = 8;
    const rows = 8;
    const count = cols * rows;

    const list: WatermarkDoodle[] = [];

    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;

      const baseTop = (r / rows) * 90 + 3;
      const baseLeft = (c / cols) * 90 + 3;

      // Random jitter inside the grid cell
      const jitterTop = (Math.random() * 12) - 6;
      const jitterLeft = (Math.random() * 12) - 6;

      const top = Math.min(94, Math.max(2, baseTop + jitterTop));
      const left = Math.min(94, Math.max(2, baseLeft + jitterLeft));
      const rotation = Math.floor(Math.random() * 360) - 180;
      const scale = Number((0.7 + Math.random() * 0.65).toFixed(2));
      const opacity = Number((0.14 + Math.random() * 0.16).toFixed(2));
      const duration = Number((14 + Math.random() * 14).toFixed(1));
      const delay = Number((Math.random() * 5).toFixed(1));
      const type = types[Math.floor(Math.random() * types.length)];

      list.push({
        type,
        top,
        left,
        rotation,
        scale,
        opacity,
        duration,
        delay
      });
    }

    this.doodles = list;
  }
}
