import { Component, inject } from '@angular/core';
import { LucideAngularModule, LogOut as LogOutIcon, Activity as ActivityIcon } from 'lucide-angular';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-inicio',
  imports: [
    LucideAngularModule,
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
})
export class InicioComponent {
  private readonly auth = inject(AuthService);

  readonly ic = { LogOut: LogOutIcon, Activity: ActivityIcon };

  get isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  logout(): void {
    this.auth.logout();
  }
}