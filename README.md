# Pausas Activas
 
Aplicación web y móvil para la gestión de pausas activas en entornos laborales. Programa recordatorios automáticos, guía rutinas de estiramiento y movilidad, y mide el cumplimiento por trabajador y por área.
 
Proyecto académico — Uniempresarial, promoción 16B.
 
---
 
## Qué hace
 
**Trabajador**
- Consulta sus pausas programadas del día
- Recibe notificaciones en la hora configurada
- Ejecuta rutinas guiadas de estiramiento, movilidad, salud visual y respiración
- Activa el modo "No molestar" mientras dura la pausa
- Revisa su historial de cumplimiento
**Administrador**
- Gestiona trabajadores, áreas y jornadas laborales
- Configura los horarios de las pausas
- Monitorea el cumplimiento con dashboards
- Genera reportes filtrados por trabajador, área y fecha
---
 
## Stack
 
| Capa | Tecnología |
|---|---|
| Frontend | Angular 19 + Bootstrap 5 |
| Móvil | Capacitor 7 (Android) |
| Backend | Node.js 20 + Express 5 |
| Base de datos | PostgreSQL 16 |
| Autenticación | JWT + bcrypt |
| Entorno local | Docker Compose |
 
---
 
## Estructura
 
```
pausas-activas/
├── db/                  Scripts SQL (esquema y datos de prueba)
│   ├── 01_schema.sql
│   └── 02_seed.sql
├── backend/             API REST
│   └── src/
│       ├── config/      Conexión a la base de datos
│       ├── middlewares/ Autenticación y manejo de errores
│       └── modules/     auth, pausas, rutinas
├── frontend/            Aplicación Angular + Capacitor
├── docs/                Documentación del proyecto
├── docker-compose.yml
└── README.md
```
 
El backend sigue una arquitectura en capas. Cada módulo se divide en `routes` (rutas), `controller` (validación de entrada), `service` (reglas de negocio) y `repository` (acceso a datos). La capa de rutas nunca consulta la base directamente.
 
---
 
## Requisitos previos
 
- Node.js 20 o superior
- Docker Desktop (o PostgreSQL 16 instalado localmente)
- Angular CLI: `npm install -g @angular/cli`
- Android Studio (solo para compilar la app móvil)
---
 
## Puesta en marcha
 
### 1. Clonar
 
```bash
git clone https://github.com/USUARIO/pausas-activas.git
cd pausas-activas
```
 
### 2. Base de datos
 
```bash
docker compose up -d
```
 
Los scripts de `db/` se ejecutan automáticamente la primera vez. Para verificar:
 
```bash
docker exec -it pausas_db psql -U pausas_admin -d pausas_activas -c "\dt"
```
 
pgAdmin queda disponible en `http://localhost:5050`. El host del servidor es `db`, no `localhost`.
 
### 3. Backend
 
```bash
cd backend
npm install
cp .env.example .env
```
 
Genera el secreto JWT y pégalo en el `.env`:
 
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
 
```bash
npm run dev
```
 
La API queda en `http://localhost:3000`. Verifica con `curl http://localhost:3000/api/health`.
 
### 4. Frontend
 
```bash
cd frontend
npm install
ng serve
```
 
Disponible en `http://localhost:4200`.
 
### 5. App móvil
 
```bash
cd frontend
ng build
npx cap sync
npx cap open android
```
 
---
 
## Variables de entorno
 
Nunca se sube el `.env` al repositorio. Usa `.env.example` como plantilla.
 
| Variable | Descripción |
|---|---|
| `PORT` | Puerto de la API |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | Secreto para firmar los tokens |
| `JWT_EXPIRES_IN` | Vigencia del token |
| `BCRYPT_ROUNDS` | Costo del hash de contraseñas |
| `CORS_ORIGIN` | Origen permitido del frontend |
 
---
 
## Endpoints
 
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Inicia sesión y devuelve el token |
| GET | `/api/auth/perfil` | Datos del usuario autenticado |
| GET | `/api/pausas/mias` | Pausas programadas del trabajador |
| POST | `/api/pausas` | Programa una pausa |
| POST | `/api/pausas/:id/iniciar` | Abre el registro al arrancar la pausa |
| PATCH | `/api/pausas/registros/:id/finalizar` | Cierra el registro con su estado |
| GET | `/api/pausas/historial` | Historial del trabajador |
| GET | `/api/pausas/cumplimiento` | Indicadores de cumplimiento |
| GET | `/api/rutinas` | Catálogo de rutinas |
| GET | `/api/rutinas/:id` | Rutina con sus ejercicios |
 
---
 
## Convenciones de trabajo
 
### Ramas
 
```
main          Estable, solo recibe merges desde develop
develop       Integración del equipo
feature/xxx   Funcionalidad nueva
fix/xxx       Corrección de errores
```
 
Nadie hace push directo a `main`. Todo entra por Pull Request con al menos una revisión.
 
### Commits
 
Se usa Conventional Commits:
 
```
feat: agregar endpoint de historial de pausas
fix: corregir cálculo de duración real
docs: actualizar README con comandos de Capacitor
refactor: extraer lógica de notificación a un servicio
```
 
### Base de datos
 
Los cambios de esquema van en scripts numerados dentro de `db/`. No se modifica un script ya aplicado; se crea uno nuevo. Las reglas de negocio que se puedan expresar como restricción (CHECK, UNIQUE, NOT NULL) van en la base y no solo en el código.
 
---
 
## Estado
 
| Módulo | Estado |
|---|---|
| Esquema de base de datos | Completo |
| API de autenticación | Completo |
| API de pausas y rutinas | Completo |
| API de administración | Pendiente |
| Scheduler de notificaciones | Pendiente |
| Frontend Angular | En desarrollo |
| App Android | Pendiente |
 
---
 
## Equipo
 
Allison, Hector, Alvaro, Julian y Sharit — Promoción 16B.
