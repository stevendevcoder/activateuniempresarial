import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UsersService } from '../core/services/users.service';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="page-full">
      <nav class="tabbar">
        <div class="brand-side">
          <img src="logo-ue.png" alt="Uniempresarial" />
          <strong>ACTIVATE</strong>
        </div>
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active-link"
            [routerLinkActiveOptions]="{ exact: item.exact }"
          >
            <app-icon [name]="item.icon" [size]="22" />
            {{ item.label }}
          </a>
        }
      </nav>
      <div class="app-content">
        <router-outlet />
      </div>
    </div>
  `,
})
export class AdminShellComponent implements OnInit {
  private readonly users = inject(UsersService);

  readonly items = [
    { path: '/admin', label: 'Inicio', icon: 'grid', exact: true },
    { path: '/admin/trabajadores', label: 'Trabajadores', icon: 'users', exact: false },
    { path: '/admin/seguimiento', label: 'Seguimiento', icon: 'bars', exact: false },
    { path: '/admin/perfil', label: 'Perfil', icon: 'user', exact: false },
  ];

  ngOnInit(): void {
    this.users.loadWorkers().subscribe();
  }
}
