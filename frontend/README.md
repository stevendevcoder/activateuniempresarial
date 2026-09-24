# ACTIVATE — Frontend

Aplicación web de **pausas activas** para Uniempresarial (Angular 19 standalone + Tailwind v4). Todas las pantallas consumen la API REST del backend; no hay datos quemados ni modo demostración.

## Pantallas

**Trabajador (`/app`):** login, inicio, mis pausas (jornada según el cronograma de su área), historial, ejecución guiada con video, rutinas, perfil (foto, contraseña, consentimiento Habeas Data) y notificaciones.

**Administrador (`/admin`):** panel con analítica y exportes PDF/Excel, trabajadores (CRUD), seguimiento y detalle de cumplimiento, áreas, rutinas y videos, cronogramas, pausas (telemetría), configuración global y festivos, privacidad y perfil.

## Cómo correrlo

```bash
npm install
npm start
```

Abre `http://localhost:4200`. El backend debe estar en `http://localhost:3000` (ver `src/environments/environment.ts`).

## Cuenta inicial

El backend crea al arrancar el administrador `admin@pausas.com` / `admin123`. Los trabajadores se crean desde **Administrador → Trabajadores**, asignándoles un área; para que vean pausas en su jornada, el área debe tener un cronograma en **Cronogramas**.

## Estructura

```
src/app/
├── core/
│   ├── api.types.ts      Contratos de la API
│   ├── models.ts         Modelos de la interfaz
│   ├── services/         auth, admin, analytics, portal, pausas, rutinas, dialog
│   ├── guards/           authGuard, guestGuard, adminGuard, workerGuard
│   └── interceptors/     token JWT y cierre de sesión al expirar
├── layout/               Shells de trabajador y administrador
├── pages/                worker/, admin/, login/
└── shared/               Íconos, avatar, mascota, anillo de progreso, diálogo
```

Los estilos compartidos (tarjetas, KPIs, formularios, modales, filtros) están en `src/styles.css`.

## Roles

El rol sale de `GET /api/me` (`role: "Administrador"` → panel administrativo; cualquier otro → portal del trabajador).
