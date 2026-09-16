# Backend — Pausas Activas

API REST de Node.js + TypeScript + PostgreSQL (TypeORM) + JWT.

## Estructura

```
backend/
└── src/
    ├── config/          Conexión a la BD y variables de entorno
    ├── middlewares/     Autenticación (JWT)
    └── modules/
        └── auth/        Módulo de autenticación y usuarios
            ├── routes/        Definición de endpoints
            ├── controller/    Validación de entrada y respuestas HTTP
            ├── service/       Reglas de negocio
            ├── repository/    Acceso a datos (TypeORM)
            └── validation/    Esquemas Joi
```

## Puesta en marcha

```bash
npm install
cp .env.example .env
npm run dev
```

La API queda en `http://localhost:3000`.

## Endpoints

| Método | Ruta | Descripción | Requiere token |
|---|---|---|---|
| GET | `/api/health` | Estado del servicio | No |
| POST | `/api/login` | Inicia sesión y genera token JWT | No |
| POST | `/api/users` | Crea un usuario | No |
| GET | `/api/users` | Lista usuarios activos | Sí |
| GET | `/api/users/:id` | Consulta usuario por ID | Sí |
| GET | `/api/users/email/:email` | Consulta usuario por email | Sí |
| PUT | `/api/users/:id` | Actualiza un usuario | Sí |
| DELETE | `/api/users/:id` | Da de baja un usuario (status = 0) | Sí |

Para rutas protegidas:

```
Authorization: Bearer TOKEN_GENERADO
```