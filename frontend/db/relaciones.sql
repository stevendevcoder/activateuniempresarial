USE pausas_activas;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE user
  ADD COLUMN id_area INT NULL AFTER status_user;

UPDATE user SET id_area = 4 WHERE id_user = 1;
UPDATE user SET id_area = 1 WHERE id_user = 2;
UPDATE user SET id_area = 2 WHERE id_user = 3;
UPDATE user SET id_area = 3 WHERE id_user = 4;
UPDATE user SET id_area = 4 WHERE id_user = 5;

ALTER TABLE user
  ADD CONSTRAINT fk_user_area FOREIGN KEY (id_area) REFERENCES area(id_area);

ALTER TABLE pausa
  ADD COLUMN id_rutina INT NULL AFTER id_user;

UPDATE pausa SET id_rutina = 1 WHERE title_pausa LIKE '%Estiramiento%' OR title_pausa LIKE '%Pausa activa%';
UPDATE pausa SET id_rutina = 2 WHERE title_pausa LIKE '%visual%';

ALTER TABLE pausa
  ADD CONSTRAINT fk_pausa_rutina FOREIGN KEY (id_rutina) REFERENCES rutina(id_rutina);

SET FOREIGN_KEY_CHECKS = 1;
