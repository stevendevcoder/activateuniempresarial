import { MigrationInterface, QueryRunner } from "typeorm";

export class GlobalConfig1758200000000 implements MigrationInterface {
    name = "GlobalConfig1758200000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.global_config (
                id_config          INTEGER PRIMARY KEY,
                lunch_start        VARCHAR(5) NOT NULL DEFAULT '12:00',
                lunch_end          VARCHAR(5) NOT NULL DEFAULT '14:00',
                max_postponements  INTEGER NOT NULL DEFAULT 2,
                dashboard_mode     VARCHAR(20) NOT NULL DEFAULT 'realtime',
                updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await queryRunner.query(`
            INSERT INTO users.global_config (id_config, lunch_start, lunch_end, max_postponements, dashboard_mode)
            VALUES (1, '12:00', '14:00', 2, 'realtime')
            ON CONFLICT (id_config) DO NOTHING
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.holiday (
                id_holiday         SERIAL PRIMARY KEY,
                holiday_date       DATE NOT NULL,
                name_holiday       VARCHAR(150) NOT NULL,
                recurring_holiday  BOOLEAN NOT NULL DEFAULT FALSE,
                status_holiday     INTEGER NOT NULL DEFAULT 1
            )
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_holiday_date
            ON users.holiday (holiday_date)
            WHERE status_holiday = 1
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS users.idx_holiday_date`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.holiday`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.global_config`);
    }
}
