USE pausas_activas;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS user (
  id_user INT NOT NULL AUTO_INCREMENT,
  name_user VARCHAR(255) NOT NULL,
  email_user VARCHAR(255) NOT NULL,
  password_user VARCHAR(255) NOT NULL,
  status_user INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id_user),
  UNIQUE KEY email_user (email_user)
);

CREATE TABLE IF NOT EXISTS area (
  id_area INT NOT NULL AUTO_INCREMENT,
  name_area VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_area)
);

CREATE TABLE IF NOT EXISTS rutina (
  id_rutina INT NOT NULL AUTO_INCREMENT,
  name_rutina VARCHAR(120) NOT NULL,
  description_rutina VARCHAR(255) NOT NULL,
  category_rutina VARCHAR(40) NOT NULL,
  duration_rutina VARCHAR(20) NOT NULL,
  PRIMARY KEY (id_rutina)
);

CREATE TABLE IF NOT EXISTS pausa (
  id_pausa INT NOT NULL AUTO_INCREMENT,
  id_user INT NOT NULL,
  title_pausa VARCHAR(120) NOT NULL,
  time_pausa VARCHAR(20) NOT NULL,
  status_pausa VARCHAR(20) NOT NULL,
  date_pausa DATE NOT NULL,
  PRIMARY KEY (id_pausa),
  CONSTRAINT fk_pausa_user FOREIGN KEY (id_user) REFERENCES user(id_user)
);

DELETE FROM pausa;
DELETE FROM rutina;
DELETE FROM area;
DELETE FROM user;

INSERT INTO user (id_user, name_user, email_user, password_user, status_user) VALUES
(1, 'Admin Pausas Activas', 'admin@pausas.com', '$2b$12$JPSBc62nOdqDJBem3YSpLe7xBqguREWx5s8nEjtjYGT/erXPM0O.2', 1),
(2, 'Sharit Cardona', 'sharit@uniempresarial.edu.co', '$2b$12$JPSBc62nOdqDJBem3YSpLe7xBqguREWx5s8nEjtjYGT/erXPM0O.2', 1),
(3, 'Laura Martínez', 'laura.martinez@uniempresarial.edu.co', '$2b$12$JPSBc62nOdqDJBem3YSpLe7xBqguREWx5s8nEjtjYGT/erXPM0O.2', 1),
(4, 'Carlos Rodríguez', 'carlos.rodriguez@uniempresarial.edu.co', '$2b$12$JPSBc62nOdqDJBem3YSpLe7xBqguREWx5s8nEjtjYGT/erXPM0O.2', 1),
(5, 'María Gómez', 'maria.gomez@uniempresarial.edu.co', '$2b$12$JPSBc62nOdqDJBem3YSpLe7xBqguREWx5s8nEjtjYGT/erXPM0O.2', 1);

INSERT INTO area (name_area) VALUES
('Administrativa'),
('Financiera'),
('Comercial'),
('Talento Humano');

INSERT INTO rutina (name_rutina, description_rutina, category_rutina, duration_rutina) VALUES
('Pausas activas', 'Estiramientos para liberar tensión', 'estiramiento', '5-10 min'),
('Salud visual', 'Descansa tus ojos después de usar pantallas', 'visual', '3-5 min'),
('Respiración', 'Respira y recupera tu ritmo', 'respiracion', '3 min'),
('Movilidad', 'Activa tu cuerpo durante la jornada', 'movilidad', '5 min');

INSERT INTO pausa (id_user, title_pausa, time_pausa, status_pausa, date_pausa) VALUES
(2, 'Estiramiento de cuello', '10:30 a.m.', 'completada', CURDATE()),
(2, 'Estiramiento de brazos', '03:00 p.m.', 'pendiente', CURDATE()),
(2, 'Descanso visual', '04:15 p.m.', 'pendiente', CURDATE()),
(3, 'Pausa activa mañana', '10:00 a.m.', 'completada', CURDATE()),
(3, 'Pausa activa tarde', '03:30 p.m.', 'completada', CURDATE()),
(4, 'Pausa activa mañana', '09:30 a.m.', 'pendiente', CURDATE()),
(4, 'Descanso visual', '04:00 p.m.', 'pendiente', CURDATE()),
(5, 'Pausa activa mañana', '10:15 a.m.', 'completada', CURDATE()),
(5, 'Pausa activa tarde', '03:15 p.m.', 'pendiente', CURDATE());

SET FOREIGN_KEY_CHECKS = 1;
