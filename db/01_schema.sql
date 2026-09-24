-- Esquema de la base de datos de Pausas Activas
-- Módulos: auth (usuarios), roles y permisos (EP02), áreas (EP03), media (EP05),
--          tipos de rutina (EP06) y rutinas (EP07)

CREATE SCHEMA IF NOT EXISTS users;

-- EP02: Roles
CREATE TABLE IF NOT EXISTS users.role (
    id_role         SERIAL PRIMARY KEY,
    name_role       VARCHAR(100) NOT NULL UNIQUE,
    description_role VARCHAR(255) NOT NULL DEFAULT '',
    status_role     INTEGER NOT NULL DEFAULT 1
);

-- EP02: Permisos
CREATE TABLE IF NOT EXISTS users.permission (
    id_permission       SERIAL PRIMARY KEY,
    name_permission     VARCHAR(100) NOT NULL UNIQUE,
    module_permission   VARCHAR(100) NOT NULL,
    description_permission VARCHAR(255) NOT NULL DEFAULT ''
);

-- EP02: Asociación rol <-> permiso
CREATE TABLE IF NOT EXISTS users.role_permission (
    id_role         INTEGER NOT NULL REFERENCES users.role(id_role) ON DELETE CASCADE,
    id_permission   INTEGER NOT NULL REFERENCES users.permission(id_permission) ON DELETE CASCADE,
    PRIMARY KEY (id_role, id_permission)
);

-- EP04: Usuarios (referencia a roles creados arriba; el FK a área se agrega al final por la relación circular)
CREATE TABLE IF NOT EXISTS users."user" (
    id_user      SERIAL PRIMARY KEY,
    name_user    VARCHAR(255) NOT NULL,
    email_user   VARCHAR(255) NOT NULL UNIQUE,
    password_user VARCHAR(255) NOT NULL,
    status_user  INTEGER NOT NULL DEFAULT 1,
    id_role      INTEGER REFERENCES users.role(id_role),
    id_area      INTEGER,
    photo_user   VARCHAR(500),
    anonymized_user BOOLEAN NOT NULL DEFAULT FALSE
);

-- EP03: Áreas (el responsable es un usuario)
CREATE TABLE IF NOT EXISTS users.area (
    id_area             SERIAL PRIMARY KEY,
    name_area           VARCHAR(255) NOT NULL,
    description_area    VARCHAR(255) NOT NULL DEFAULT '',
    id_responsible_user INTEGER REFERENCES users."user"(id_user),
    status_area         INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE users."user"
    ADD CONSTRAINT fk_user_area FOREIGN KEY (id_area) REFERENCES users.area(id_area);

-- EP05: Repositorio multimedia
CREATE TABLE IF NOT EXISTS users.video (
    id_video              SERIAL PRIMARY KEY,
    title_video           VARCHAR(255) NOT NULL,
    description_video     VARCHAR(500) NOT NULL DEFAULT '',
    file_name_video       VARCHAR(255) NOT NULL,
    file_path_video       VARCHAR(500) NOT NULL,
    mime_type_video       VARCHAR(100) NOT NULL,
    size_video            INTEGER NOT NULL DEFAULT 0,
    duration_seconds_video INTEGER NOT NULL DEFAULT 0,
    status_video          INTEGER NOT NULL DEFAULT 1
);

-- EP06: Tipos de rutina
CREATE TABLE IF NOT EXISTS users.routine_type (
    id_routine_type       SERIAL PRIMARY KEY,
    name_routine_type     VARCHAR(100) NOT NULL,
    description_routine_type VARCHAR(255) NOT NULL DEFAULT '',
    icon_routine_type     VARCHAR(50) NOT NULL DEFAULT '',
    color_routine_type    VARCHAR(20) NOT NULL DEFAULT '',
    status_routine_type   INTEGER NOT NULL DEFAULT 1
);

-- EP07: Rutinas
CREATE TABLE IF NOT EXISTS users.routine (
    id_routine       SERIAL PRIMARY KEY,
    name_routine     VARCHAR(255) NOT NULL,
    description_routine VARCHAR(500) NOT NULL DEFAULT '',
    id_routine_type  INTEGER NOT NULL REFERENCES users.routine_type(id_routine_type),
    status_routine   INTEGER NOT NULL DEFAULT 1
);

-- EP07: Videos dentro de una rutina (orden y duración)
CREATE TABLE IF NOT EXISTS users.routine_video (
    id_routine_video  SERIAL PRIMARY KEY,
    id_routine        INTEGER NOT NULL REFERENCES users.routine(id_routine) ON DELETE CASCADE,
    id_video          INTEGER NOT NULL REFERENCES users.video(id_video),
    duration_seconds  INTEGER NOT NULL,
    position          INTEGER NOT NULL
);

-- EP08/EP09: Registro de pausas activas ejecutadas/programadas
CREATE TABLE IF NOT EXISTS users.pausa (
    id_pausa      SERIAL PRIMARY KEY,
    id_user       INTEGER NOT NULL REFERENCES users."user"(id_user) ON DELETE CASCADE,
    id_routine    INTEGER REFERENCES users.routine(id_routine),
    id_area       INTEGER REFERENCES users.area(id_area),
    scheduled_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMP,
    status_pausa  INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_pausa_user ON users.pausa(id_user);
CREATE INDEX IF NOT EXISTS idx_pausa_area ON users.pausa(id_area);
CREATE INDEX IF NOT EXISTS idx_pausa_scheduled ON users.pausa(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_pausa_status ON users.pausa(status_pausa);

-- EP15: Configuración global e institucional
CREATE TABLE IF NOT EXISTS users.global_config (
    id_config          INTEGER PRIMARY KEY,
    lunch_start        VARCHAR(5) NOT NULL DEFAULT '12:00',
    lunch_end          VARCHAR(5) NOT NULL DEFAULT '14:00',
    max_postponements  INTEGER NOT NULL DEFAULT 2,
    dashboard_mode     VARCHAR(20) NOT NULL DEFAULT 'realtime',
    retention_months   INTEGER NOT NULL DEFAULT 24,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users.global_config (id_config, lunch_start, lunch_end, max_postponements, dashboard_mode)
VALUES (1, '12:00', '14:00', 2, 'realtime')
ON CONFLICT (id_config) DO NOTHING;

CREATE TABLE IF NOT EXISTS users.holiday (
    id_holiday         SERIAL PRIMARY KEY,
    holiday_date       DATE NOT NULL,
    name_holiday       VARCHAR(150) NOT NULL,
    recurring_holiday  BOOLEAN NOT NULL DEFAULT FALSE,
    status_holiday     INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_holiday_date
ON users.holiday (holiday_date)
WHERE status_holiday = 1;

-- EP12: Motor de programación y cronogramas
CREATE TABLE IF NOT EXISTS users.schedule (
    id_schedule        SERIAL PRIMARY KEY,
    id_area            INTEGER NOT NULL UNIQUE REFERENCES users.area(id_area),
    id_routine         INTEGER REFERENCES users.routine(id_routine),
    start_time         VARCHAR(5) NOT NULL,
    end_time           VARCHAR(5) NOT NULL,
    frequency_minutes  INTEGER NOT NULL DEFAULT 120,
    duration_minutes   INTEGER NOT NULL DEFAULT 5,
    days_of_week       VARCHAR(20) NOT NULL DEFAULT '1,2,3,4,5',
    paused_schedule    BOOLEAN NOT NULL DEFAULT FALSE,
    status_schedule    INTEGER NOT NULL DEFAULT 1,
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users.schedule_event (
    id_event       SERIAL PRIMARY KEY,
    id_schedule    INTEGER NOT NULL REFERENCES users.schedule(id_schedule) ON DELETE CASCADE,
    id_area        INTEGER NOT NULL REFERENCES users.area(id_area),
    id_routine     INTEGER REFERENCES users.routine(id_routine),
    scheduled_at   TIMESTAMP NOT NULL,
    slot_key       VARCHAR(80) NOT NULL UNIQUE,
    status_event   INTEGER NOT NULL DEFAULT 1,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_event_area ON users.schedule_event(id_area);
CREATE INDEX IF NOT EXISTS idx_schedule_event_scheduled ON users.schedule_event(scheduled_at);

-- EP13: Telemetría y registro de cumplimiento (inmutable)
CREATE TABLE IF NOT EXISTS users.pausa_event (
    id_pausa_event    SERIAL PRIMARY KEY,
    id_user           INTEGER NOT NULL REFERENCES users."user"(id_user),
    id_pausa          INTEGER REFERENCES users.pausa(id_pausa),
    id_schedule_event INTEGER REFERENCES users.schedule_event(id_event),
    id_area           INTEGER REFERENCES users.area(id_area),
    event_type        INTEGER NOT NULL,
    reason            VARCHAR(255),
    occurred_at       TIMESTAMP NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pausa_event_user ON users.pausa_event(id_user);
CREATE INDEX IF NOT EXISTS idx_pausa_event_occurred ON users.pausa_event(occurred_at);

CREATE OR REPLACE FUNCTION users.prevent_pausa_event_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'La tabla pausa_event es inmutable (EP13)';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pausa_event_immutable ON users.pausa_event;
CREATE TRIGGER trg_pausa_event_immutable
BEFORE UPDATE OR DELETE ON users.pausa_event
FOR EACH ROW EXECUTE FUNCTION users.prevent_pausa_event_mutation();

-- EP16: Consentimiento informado (Ley 1581 de 2012)
CREATE TABLE IF NOT EXISTS users.consent (
    id_consent       SERIAL PRIMARY KEY,
    id_user          INTEGER NOT NULL REFERENCES users."user"(id_user) ON DELETE CASCADE,
    version_consent  VARCHAR(20) NOT NULL DEFAULT '1.0',
    accepted_consent BOOLEAN NOT NULL DEFAULT TRUE,
    accepted_at      TIMESTAMP NOT NULL,
    revoked_at       TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consent_user ON users.consent(id_user);

COMMENT ON TABLE users."user" IS 'Usuarios de la aplicación (trabajadores y administradores)';
COMMENT ON COLUMN users."user".status_user IS '1 = activo, 0 = inactivo (baja lógica)';
COMMENT ON COLUMN users."user".photo_user IS 'Ruta pública de la foto de perfil (EP09)';
COMMENT ON TABLE users.role IS 'Roles de acceso (Administrador, Trabajador)';
COMMENT ON TABLE users.permission IS 'Catálogo de permisos por módulo';
COMMENT ON TABLE users.area IS 'Áreas/departamentos/facultades de la universidad';
COMMENT ON TABLE users.video IS 'Repositorio multimedia de videos/animaciones';
COMMENT ON TABLE users.routine_type IS 'Categorías maestras de rutinas (pausa visual, estiramiento, cognitiva...)';
COMMENT ON TABLE users.routine IS 'Rutina final (tipo + videos)';
COMMENT ON TABLE users.routine_video IS 'Detalle de videos dentro de una rutina (duración y orden)';
COMMENT ON TABLE users.pausa IS 'Registro de pausas activas por usuario (EP08/EP09)';
COMMENT ON COLUMN users.pausa.status_pausa IS '1 = programada, 2 = completada, 3 = aplazada, 4 = cancelada';
COMMENT ON TABLE users.global_config IS 'Parámetros globales institucionales (EP15)';
COMMENT ON COLUMN users.global_config.lunch_start IS 'Inicio del almuerzo institucional (HH:mm)';
COMMENT ON COLUMN users.global_config.lunch_end IS 'Fin del almuerzo institucional (HH:mm)';
COMMENT ON COLUMN users.global_config.max_postponements IS 'Máximo de aplazamientos permitidos por pausa (EP11)';
COMMENT ON COLUMN users.global_config.dashboard_mode IS 'realtime = dashboard en vivo, batch = por lote (EP13)';
COMMENT ON TABLE users.holiday IS 'Días festivos en los que no se programan pausas (EP15)';
COMMENT ON COLUMN users.holiday.recurring_holiday IS 'TRUE si el festivo se repite cada año en la misma fecha';
COMMENT ON TABLE users.schedule IS 'Cronograma de pausas por área (EP12)';
COMMENT ON COLUMN users.schedule.frequency_minutes IS 'Frecuencia entre pausas en minutos (ej. 120 = cada 2 horas)';
COMMENT ON COLUMN users.schedule.days_of_week IS 'Días activos, 0=domingo ... 6=sábado (CSV)';
COMMENT ON COLUMN users.schedule.paused_schedule IS 'TRUE si el cronograma está pausado temporalmente (EP12.4)';
COMMENT ON TABLE users.schedule_event IS 'Eventos emitidos por el motor de programación (EP12.3)';
COMMENT ON COLUMN users.schedule_event.slot_key IS 'Clave única idempotente: schedule:fecha:franja';
COMMENT ON COLUMN users.schedule_event.status_event IS '1 = emitido, 2 = notificado, 3 = fallido';
COMMENT ON TABLE users.pausa_event IS 'Log inmutable de telemetría: inicio/fin/aplazamiento/cancelación (EP13)';
COMMENT ON COLUMN users.pausa_event.event_type IS '1 = inicio, 2 = fin, 3 = aplazamiento, 4 = cancelación';
COMMENT ON COLUMN users.pausa_event.reason IS 'Motivo obligatorio en cancelaciones (EP11.5)';
COMMENT ON TABLE users.consent IS 'Consentimiento informado de tratamiento de datos (EP16, Ley 1581)';
COMMENT ON COLUMN users.consent.revoked_at IS 'Fecha de revocación del consentimiento (NULL si sigue activo)';
COMMENT ON COLUMN users."user".anonymized_user IS 'TRUE cuando los datos personales fueron anonimizados (EP16)';
COMMENT ON COLUMN users.global_config.retention_months IS 'Meses de retención antes de anonimizar (EP16)';