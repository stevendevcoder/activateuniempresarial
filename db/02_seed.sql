-- Datos de prueba
-- Usuario admin inicial: admin@pausas.com / admin123

INSERT INTO users."user" (name_user, email_user, password_user, status_user)
VALUES (
    'Admin Pausas Activas',
    'admin@pausas.com',
    '$2b$12$JPSBc62nOdqDJBem3YSpLe7xBqguREWx5s8nEjtjYGT/erXPM0O.2', -- hash bcrypt de admin123
    1
);