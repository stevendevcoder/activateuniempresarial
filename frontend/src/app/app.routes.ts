import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/admin.guard';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'portal',
    loadComponent: () => import('./portal/portal.component').then((m) => m.PortalComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./admin/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'areas',
        loadComponent: () =>
          import('./admin/areas/areas.component').then((m) => m.AreasComponent),
      },
      {
        path: 'routines',
        loadComponent: () =>
          import('./admin/routines/routines.component').then((m) => m.RoutinesComponent),
      },
      {
        path: 'pauses',
        loadComponent: () =>
          import('./admin/telemetry/telemetry.component').then((m) => m.TelemetryComponent),
      },
      {
        path: 'schedules',
        loadComponent: () =>
          import('./admin/schedules/schedules.component').then((m) => m.SchedulesComponent),
      },
      {
        path: 'config',
        loadComponent: () =>
          import('./admin/config/config.component').then((m) => m.ConfigComponent),
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./admin/privacy/privacy.component').then((m) => m.PrivacyComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'admin' },
];
