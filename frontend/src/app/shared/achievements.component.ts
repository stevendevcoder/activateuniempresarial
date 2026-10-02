import { Component, input } from '@angular/core';
import { Achievement } from '../core/models';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-achievements',
  imports: [IconComponent],
  template: `
    <div class="grid grid-cols-3 gap-3">
      @for (a of achievements(); track a.id) {
        <div class="flex flex-col items-center text-center gap-1.5" [class.opacity-45]="!a.unlocked" [attr.title]="a.description">
          <span
            class="grid place-items-center w-12 h-12 rounded-full"
            [class]="a.unlocked
              ? 'bg-gradient-to-br from-brand-700 to-brand-900 text-white shadow-lg shadow-brand-900/20'
              : 'bg-slate-200 text-slate-400'"
          >
            <app-icon [name]="a.icon" [size]="22" />
          </span>
          <b class="text-[11px] leading-tight" [class]="a.unlocked ? 'text-brand-900' : 'text-slate-400'">
            {{ a.title }}
          </b>
          <small class="text-[10px] leading-tight text-slate-400">{{ a.description }}</small>
        </div>
      }
    </div>
  `,
})
export class AchievementsComponent {
  readonly achievements = input.required<Achievement[]>();
}