-- Esquema de la base de datos de Pausas Activas
-- Motor: PostgreSQL 16
-- Módulo actual: auth (usuarios)

CREATE SCHEMA IF NOT EXISTS users;

CREATE TABLE IF NOT EXISTS users."user" (
    id_user       SERIAL PRIMARY KEY,
    name_user     VARCHAR(255) NOT NULL,
    email_user    VARCHAR(255) NOT NULL UNIQUE,
    password_user VARCHAR(255) NOT NULL,
    status_user   INTEGER NOT NULL DEFAULT 1
);

COMMENT ON TABLE users."user" IS 'Usuarios de la aplicación (trabajadores y administradores)';
COMMENT ON COLUMN users."user".status_user IS '1 = activo, 0 = inactivo (baja lógica)';
