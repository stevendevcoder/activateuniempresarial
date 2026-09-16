import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { InicioComponent } from './inicio/inicio.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'inicio', component: InicioComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];