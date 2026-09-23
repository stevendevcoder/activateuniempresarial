# Backend — Pausas Activas

API REST de Node.js + TypeScript + PostgreSQL (TypeORM) + JWT.

## Estructura

```
backend/
└── src/
    ├── config/          Conexión BD, variables de entorno, permisos, media, bootstrap, logger
    ├── middlewares/      JWT, RBAC, rate-limit, error handler
    ├── utils/           Helpers (parsePositiveInt)
    ├── migrations/      Migraciones TypeORM
    └── modules/
        ├── auth/        Login, usuarios, roles, áreas (CRUD)
        ├── media/       Upload de archivos (multer + streaming)
        ├── routine-types/  Tipos de rutina (CRUD)
        ├── routines/    Rutinas asignadas a usuarios
        ├── pausas/      Entidad + repositorio de pausas
        ├── analytics/   Dashboard admin (resumen, series, áreas, export PDF/Excel)
        ├── config/      Configuración global y festivos (EP15)
        ├── schedules/   Motor de programación y cronogramas (EP12)
        ├── telemetry/   Log inmutable de cumplimiento (EP13)
        ├── privacy/     Consentimiento, retención y anonimización (EP16)
        └── portal/      Portal del trabajador (historial, racha, stats, perfil+foto, pausas)
```

## Puesta en marcha

```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo con nodemon + tsx |
| `npm run build` | Compila a dist/ |
| `npm start` | Ejecuta dist/index.js |
| `npm test` | Tests con vitest |
| `npm run migration:run` | Ejecuta migraciones pendientes |
| `npm run migration:generate` | Genera migración desde cambios en entidades |
| `npm run migration:revert` | Reverte última migración |

## Seguridad

- **Rate limiting**: 10 intentos/15min en `/api/login`, 200 req/15min global
- **JWT + RBAC**: permisos por módulo, wildcard `"*"` para admins
- **Sanitización**: contraseñas nunca se exponen en respuestas HTTP
- **Subida de archivos**: extensión derivada del MIME (no del nombre), max 5MB avatars, `X-Content-Type-Options: nosniff`
- **CORS**: configurable via `CORS_ORIGIN`
- **Graceful shutdown**: SIGTERM/SIGINT cierran server + BD

## Endpoints

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio (+ verificación de BD) |
| POST | `/api/login` | Login → token JWT |

### Usuarios

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/api/users` | `users:create` | Crear usuario |
| GET | `/api/users` | `users:read` | Listar usuarios (sin password) |
| GET | `/api/users/:id` | `users:read` | Obtener usuario por ID |
| PUT | `/api/users/:id` | `users:update` | Actualizar usuario |
| DELETE | `/api/users/:id` | `users:delete` | Desactivar usuario |

### Roles / Áreas / Media / Rutinas

CRUD completo con RBAC por permiso (`roles:*`, `areas:*`, `media:*`, `routine-types:*`, `routines:*`).

### Analytics (admin)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/analytics/summary` | `analytics:read` |
| GET | `/api/analytics/timeline` | `analytics:read` |
| GET | `/api/analytics/areas` | `analytics:read` |
| GET | `/api/analytics/export/pdf` | `analytics:export` |
| GET | `/api/analytics/export/xlsx` | `analytics:export` |

### Portal del trabajador

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/me/pauses` | Historial paginado |
| POST | `/api/me/pauses` | Registrar pausa |
| PUT | `/api/me/pauses/:id/status` | Cambiar estado |
| GET | `/api/me/stats` | Estadísticas + racha |
| GET | `/api/me/streak` | Racha actual/mejor |
| PUT | `/api/me/profile` | Actualizar nombre |
| POST | `/api/me/profile/photo` | Subir avatar |

### Configuración global (EP15)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/config` | `config:read` |
| PUT | `/api/config` | `config:update` |
| GET | `/api/config/holidays` | `config:read` |
| POST | `/api/config/holidays` | `config:update` |
| DELETE | `/api/config/holidays/:id` | `config:update` |

### Cronogramas (EP12)

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/api/schedules` | `schedules:read` |
| GET | `/api/schedules/:id` · `/area/:idArea` | `schedules:read` |
| POST | `/api/schedules` | `schedules:create` |
| PUT | `/api/schedules/:id` | `schedules:update` |
| DELETE | `/api/schedules/:id` | `schedules:delete` |
| PATCH | `/api/schedules/:id/pause` · `/resume` | `schedules:update` |
| GET | `/api/schedules/events` | `schedules:read` |
| POST | `/api/schedules/run` | `schedules:update` |

Motor de scheduling (`SchedulerService`): corre cada 60 s, respeta almuerzo y festivos, idempotente por `slot_key` y emite `pausa.due` vía `schedulerEvents`. Se controla con `SCHEDULER_ENABLED`.

### Telemetría (EP13)

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/api/telemetry/events` | `telemetry:create` |
| POST | `/api/telemetry/events/batch` | `telemetry:create` |
| GET | `/api/telemetry/events/me` | autenticado |
| GET | `/api/telemetry/events` | `telemetry:read` |
| GET | `/api/telemetry/summary` | `telemetry:read` |

Log inmutable (`pausa_event`) con trigger que bloquea UPDATE/DELETE. Eventos: `1=inicio, 2=fin, 3=aplazamiento, 4=cancelación`. El aplazamiento valida el máximo definido en EP15.

### Privacidad y Habeas Data (EP16)

| Método | Ruta | Permiso |
|---|---|---|
| GET · POST · DELETE | `/api/me/consent` | autenticado |
| POST | `/api/me/data-deletion` | autenticado |
| GET | `/api/privacy/consents` | `privacy:read` |
| GET | `/api/privacy/retention/preview` | `privacy:read` |
| POST | `/api/privacy/retention/run` | `privacy:manage` |

- **Consentimiento informado** (HU-16.1): con `CONSENT_REQUIRED=true` la telemetría exige consentimiento activo.
- **Retención** (HU-16.2): `retentionMonths` en la config global; la anonimización reemplaza nombre/foto de trabajadores inactivos.
- **Exportables** (HU-16.3): `?anonymous=true` marca los informes como agregados/anonimizados.
- **Eliminación** (HU-16.4): anonimiza los datos personales del trabajador y revoca su consentimiento.

## Bootstrap automático

Al iniciar, `bootstrapData()` garantiza:
- Catálogo de permisos (28 permisos, 7 módulos)
- Roles "Administrador" (wildcard) y "Trabajador"
- Usuario `admin@pausas.com` / `admin123`
