import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard, workerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard, workerGuard],
    loadComponent: () => import('./layout/worker-shell.component').then((m) => m.WorkerShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/worker/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'pausas',
        loadComponent: () => import('./pages/worker/pausas.component').then((m) => m.PausasComponent),
      },
      {
        path: 'pausas/historial',
        loadComponent: () =>
          import('./pages/worker/historial.component').then((m) => m.HistorialComponent),
      },
      {
        path: 'pausas/ejecutar/:id',
        loadComponent: () => import('./pages/worker/player.component').then((m) => m.PlayerComponent),
      },
      {
        path: 'rutinas',
        loadComponent: () => import('./pages/worker/rutinas.component').then((m) => m.RutinasComponent),
      },
      {
        path: 'rutinas/:id',
        loadComponent: () =>
          import('./pages/worker/rutina-detalle.component').then((m) => m.RutinaDetalleComponent),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/worker/perfil.component').then((m) => m.PerfilComponent),
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./pages/worker/notificaciones.component').then((m) => m.NotificacionesComponent),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./layout/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/admin/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'trabajadores',
        loadComponent: () =>
          import('./pages/admin/trabajadores.component').then((m) => m.TrabajadoresComponent),
      },
      {
        path: 'seguimiento',
        loadComponent: () =>
          import('./pages/admin/seguimiento.component').then((m) => m.SeguimientoComponent),
      },
      {
        path: 'seguimiento/:id',
        loadComponent: () =>
          import('./pages/admin/trabajador-detalle.component').then((m) => m.TrabajadorDetalleComponent),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/admin/perfil.component').then((m) => m.AdminPerfilComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
