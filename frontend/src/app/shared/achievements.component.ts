import { Component, input } from '@angular/core';
import { Achievement } from '../core/models';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-achievements',
  imports: [IconComponent],
  template: `
    <div class="badges">
      @for (a of achievements(); track a.id) {
        <div class="badge" [class.locked]="!a.unlocked" [attr.title]="a.description">
          <span class="ring"><app-icon [name]="a.icon" [size]="22" /></span>
          <b>{{ a.title }}</b>
          <small>{{ a.description }}</small>
        </div>
      }
    </div>
  `,
  styles: `
    .badges {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .badge {
      display: grid;
      justify-items: center;
      gap: 6px;
      text-align: center;
    }
    .ring {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1b2f8a, #3b5bdb);
      color: #fff;
      box-shadow: 0 6px 16px rgba(27, 47, 138, 0.25);
    }
    .badge b {
      font-size: 12px;
      color: #1b2f8a;
      line-height: 1.1;
    }
    .badge small {
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.1;
    }
    .badge.locked .ring {
      background: #e2e8f0;
      color: #94a3b8;
      box-shadow: none;
    }
    .badge.locked b {
      color: #94a3b8;
    }
  `,
})
export class AchievementsComponent {
  readonly achievements = input.required<Achievement[]>();
}
