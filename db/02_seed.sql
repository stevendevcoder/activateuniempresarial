-- Datos iniciales de Pausas Activas
-- Se ejecutan una sola vez en el primer arranque del contenedor de PostgreSQL.
-- El backend también ejecuta un bootstrap idempotente que garantiza estos datos.

-- EP02: Roles base
INSERT INTO users.role (name_role, description_role, status_role) VALUES
    ('Administrador', 'Acceso total a la administración del sistema', 1),
    ('Trabajador', 'Usuario final que consume las pausas activas', 1);

-- EP02: Catálogo de permisos por módulo
INSERT INTO users.permission (name_permission, module_permission, description_permission) VALUES
    ('users:create',   'users',         'Crear usuarios'),
    ('users:read',     'users',         'Consultar usuarios'),
    ('users:update',   'users',         'Editar usuarios'),
    ('users:delete',   'users',         'Inactivar usuarios'),
    ('roles:create',   'roles',         'Crear roles'),
    ('roles:read',     'roles',         'Consultar roles'),
    ('roles:update',   'roles',         'Editar roles'),
    ('roles:delete',   'roles',         'Eliminar roles'),
    ('roles:assign',   'roles',         'Asignar permisos a roles'),
    ('areas:create',   'areas',         'Crear áreas'),
    ('areas:read',     'areas',         'Consultar áreas'),
    ('areas:update',   'areas',         'Editar áreas'),
    ('areas:delete',   'areas',         'Eliminar áreas'),
    ('media:create',   'media',         'Subir videos'),
    ('media:read',     'media',         'Consultar y previsualizar videos'),
    ('media:update',   'media',         'Editar o reemplazar videos'),
    ('media:delete',   'media',         'Eliminar videos'),
    ('routine-types:create', 'routine-types', 'Crear tipos de rutina'),
    ('routine-types:read',   'routine-types', 'Consultar tipos de rutina'),
    ('routine-types:update', 'routine-types', 'Editar tipos de rutina'),
    ('routine-types:delete', 'routine-types', 'Eliminar tipos de rutina'),
    ('routines:create', 'routines',     'Crear rutinas'),
    ('routines:read',   'routines',     'Consultar rutinas'),
    ('routines:update', 'routines',     'Editar rutinas'),
    ('routines:delete', 'routines',     'Eliminar rutinas'),
    ('analytics:read',  'analytics',    'Consultar analítica y dashboard'),
    ('analytics:export','analytics',    'Exportar informes PDF/Excel'),
    ('config:read',     'config',       'Consultar configuración global y festivos'),
    ('config:update',   'config',       'Editar configuración global y festivos'),
    ('schedules:create','schedules',    'Crear cronogramas de pausas'),
    ('schedules:read',  'schedules',    'Consultar cronogramas y eventos'),
    ('schedules:update','schedules',    'Editar, pausar y reanudar cronogramas'),
    ('schedules:delete','schedules',    'Eliminar cronogramas'),
    ('telemetry:create','telemetry',    'Registrar eventos de cumplimiento'),
    ('telemetry:read',  'telemetry',    'Consultar telemetría y métricas'),
    ('privacy:read',    'privacy',      'Consultar consentimientos y retención'),
    ('privacy:manage',  'privacy',      'Aplicar políticas de retención y anonimización');

-- EP02: Administrador recibe todos los permisos
INSERT INTO users.role_permission (id_role, id_permission)
SELECT 1, id_permission FROM users.permission;

-- EP02: Trabajador recibe permisos de lectura y telemetría (app móvil)
INSERT INTO users.role_permission (id_role, id_permission)
SELECT 2, id_permission FROM users.permission
WHERE name_permission IN ('routines:read', 'media:read', 'config:read', 'schedules:read', 'telemetry:create');

-- EP03: Áreas de ejemplo
INSERT INTO users.area (name_area, description_area) VALUES
    ('Facultad de Ingeniería', 'Programas de ingeniería y sistemas'),
    ('Facultad de Administración', 'Programas administrativos y financieros'),
    ('Administración Central', 'Oficinas administrativas de la universidad');

-- EP06: Tipos de rutina
INSERT INTO users.routine_type (name_routine_type, description_routine_type, icon_routine_type, color_routine_type, status_routine_type) VALUES
    ('Pausa Visual',   'Ejercicios para descansar la vista frente a pantallas', 'visibility', '#3B82F6', 1),
    ('Estiramiento',   'Estiramientos musculares suaves', 'accessibility', '#10B981', 1),
    ('Cognitiva',      'Ejercicios de concentración y memoria', 'psychology', '#F59E0B', 1);

-- EP04: Usuario administrador inicial: admin@pausas.com / admin123
INSERT INTO users."user" (name_user, email_user, password_user, status_user, id_role, id_area)
VALUES (
    'Admin Pausas Activas',
    'admin@pausas.com',
    '$2b$12$JPSBc62nOdqDJBem3YSpLe7xBqguREWx5s8nEjtjYGT/erXPM0O.2', -- hash bcrypt de admin123
    1,
    1,
    1
);

-- EP15: Configuración global inicial
INSERT INTO users.global_config (id_config, lunch_start, lunch_end, max_postponements, dashboard_mode)
VALUES (1, '12:00', '14:00', 2, 'realtime')
ON CONFLICT (id_config) DO NOTHING;

-- EP15: Festivos de ejemplo (Colombia 2026)
INSERT INTO users.holiday (holiday_date, name_holiday, recurring_holiday) VALUES
    ('2026-01-01', 'Año Nuevo', TRUE),
    ('2026-04-02', 'Jueves Santo', FALSE),
    ('2026-04-03', 'Viernes Santo', FALSE),
    ('2026-05-01', 'Día del Trabajo', TRUE),
    ('2026-07-20', 'Día de la Independencia', TRUE),
    ('2026-08-07', 'Batalla de Boyacá', TRUE),
    ('2026-12-08', 'Inmaculada Concepción', TRUE),
    ('2026-12-25', 'Navidad', TRUE)
ON CONFLICT DO NOTHING;