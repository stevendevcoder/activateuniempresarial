# ACTIVATE — Frontend

Aplicación web de **pausas activas** para Uniempresarial. Esta carpeta cubre solo el frontend (Angular 19), alineado con los mockups y con la API de autenticación del backend.

## Pantallas

**Trabajador:** login, inicio, mis pausas, historial, ejecución guiada, rutinas, perfil y notificaciones.

**Administrador:** panel, trabajadores, seguimiento y detalle de cumplimiento.

## Cómo correrlo

```bash
npm install
npm start
```

Abre `http://localhost:4200`.

El backend debe estar en `http://localhost:3000` (ver `src/environments/environment.ts`).

## Cuentas para probar

| Rol | Correo | Contraseña |
|---|---|---|
| Trabajadora | `sharit@uniempresarial.edu.co` | `Sharit1` |
| Administrador | `admin@pausas.com` | `admin123` |

`admin@pausas.com / admin123` es el usuario de prueba del seed del backend. Si la API no está arriba, esas mismas cuentas entran en modo demostración para poder presentar la interfaz.

## Qué consume del backend

- `POST /api/login`
- `GET /api/users/email/:email`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`

Pausas, rutinas y dashboards aún no existen en la API. El frontend los resuelve con datos de dominio listos para reemplazar cuando el grupo publique esos módulos.

## Roles

El backend todavía no envía un campo `role`. El frontend asigna **administrador** si el correo o el nombre contienen `admin` (incluye `admin@pausas.com`) y **trabajador** al resto.
