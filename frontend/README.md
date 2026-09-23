# UActive Frontend (Angular 19)

Frontend de la plataforma de pausas activas y bienestar SG-SST para Uniempresarial.

## Stack

- Angular 19 (standalone, zoneless-ready, signal-friendly)
- Tailwind CSS v4 (utilidades vía `@theme` en `src/styles.scss`)
- lucide-angular (iconos SVG)
- Plus Jakarta Sans (Google Fonts)

## Estructura

```text
src/
├── index.html               # HTML base + fuentes (Plus Jakarta Sans)
├── styles.scss              # Tailwind + tokens de marca (@theme)
├── environments/
│   └── environment.ts       # apiUrl → http://localhost:3000
└── app/
    ├── app.config.ts        # providers (router + HttpClient)
    ├── app.routes.ts        # /login, /inicio (guard), *
    ├── auth/
    │   ├── auth.service.ts  # POST /api/login, token JWT (localStorage)
    │   ├── auth.guard.ts    # bloquea /inicio sin sesión válida
    │   └── login/
    │       ├── login.component.ts/html/scss   # pantalla de acceso
    └── inicio/
        └── inicio.component.ts/html/scss      # post-login (placeholder)
```

## Rutas

| Ruta   | Componente         | Protegida |
| ------ | ------------------ | --------- |
| `/login`  | LoginComponent | No |
| `/inicio` | InicioComponent | Sí (authGuard: JWT vigente) |
| `*`       | redirige a `/login` | — |

## Paleta de marca

Definida como tokens Tailwind en `styles.scss` (`--color-brand-*`):

- `brand-blue` `#182987` · `brand-blue-dark` `#101d60` · `brand-blue-light` `#2a3fa8`
- `brand-red` `#ED1736` · `brand-red-hover` `#c9102b`
- `brand-soft-blue` `#EAF0FF` · `brand-soft-red` `#FFF0F2` · `brand-surface` `#F8FAFF`

## Comandos

```bash
npm install
ng serve               # dev → http://localhost:4200
npm run build          # build de producción → dist/frontend
```

## Integración con el backend

- `POST http://localhost:3000/api/login` con `{ email, password }` → `{ message, token }`.
- El token JWT se guarda en `localStorage` y `AuthService.isAuthenticated()` valida expiración
  (devuelve JWT expirado a `/login`).
- Para pruebas reales contra PostgreSQL: `docker compose up -d` en la raíz del proyecto
  (usa el seed `admin@pausas.com` / `admin123` del módulo `auth`) y levantar el backend en `backend/`.

## Notas

- UI del login usa Tailwind v4 y lucide-angular; el módulo del icono se importa así en componentes
  standalone (módulo legado no standalone):

  ```ts
  imports: [LucideAngularModule],
  // template: <i-lucide [img]="ic.Mail" class="w-4 h-4"></i-lucide>
  ```

- Fase 2 (pendiente): botón SSO Microsoft 365 y app móvil mediante Capacitor 7 (indicado en la UI).