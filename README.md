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
| Frontend | Angular 19 + Tailwind CSS v4 |
| Móvil | Capacitor 7 (Android) |
| Backend | Node.js 20 + Express 5 + TypeORM |
| Base de datos | PostgreSQL 16 |
| Autenticación | JWT + bcrypt |
| Entorno local | Docker Compose (opcional) |

---

## Estructura

```
pausas-activas/
├── db/                  Scripts SQL (esquema y datos de prueba)
│   ├── 01_schema.sql
│   └── 02_seed.sql
├── backend/             API REST
│   └── src/
│       ├── config/      Conexión BD, bootstrap, permisos, media, logger
│       ├── middlewares/  JWT, RBAC, rate-limit, errores
│       ├── utils/       Helpers (parsePositiveInt, etc.)
│       └── modules/     auth, areas, roles, media, routine-types, routines,
│                        pausas, analytics, portal
├── frontend/            Aplicación Angular standalone + Tailwind v4
├── docs/                Documentación del proyecto
├── docker-compose.yml
└── README.md
```

Cada módulo del backend sigue arquitectura en capas: `routes` → `controller` → `service` → `repository`.

---

## Requisitos previos

- Node.js 20 o superior
- Docker Desktop (o PostgreSQL 16 instalado localmente)
- Angular CLI: `npm install -g @angular/cli`

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

pgAdmin queda disponible en `http://localhost:5050`.

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

Disponible en `http://localhost:4200`. Las llamadas a `/api` se proxean al backend automáticamente.

---

## Migraciones (producción)

```bash
# Generar migración a partir de los cambios en las entidades
npm run migration:generate

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert
```

En desarrollo, `synchronize: true` aplica cambios automáticamente.

---

## Tests

```bash
cd backend
npm test
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
| `APP_TIMEZONE` | Zona horaria (default: America/Bogota) |

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

---

## Equipo

Allison, Hector, Bryan y Sharit — Promoción 16B.
