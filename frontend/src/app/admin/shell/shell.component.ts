import { Component, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  Home,
  Users,
  Building2,
  Activity,
  ClipboardList,
  LogOut,
  Menu,
  ChevronDown,
  CalendarClock,
  Settings,
  ShieldCheck,
} from 'lucide-angular';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-shell',
  imports: [UpperCasePipe, RouterLink, RouterLinkActive, RouterOutlet, LucideAngularModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  sidebarOpen = false;

  readonly ic = {
    Home,
    Users,
    Building2,
    Activity,
    ClipboardList,
    LogOut,
    Menu,
    ChevronDown,
    CalendarClock,
    Settings,
    ShieldCheck,
  };

  get userName(): string {
    return this.auth.getUser()?.email?.split('@')[0] ?? 'Admin';
  }

  get userRole(): string {
    return this.auth.getRole();
  }

  logout(): void {
    this.auth.logout();
  }
}
