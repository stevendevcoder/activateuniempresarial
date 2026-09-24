import { MigrationInterface, QueryRunner } from "typeorm";

export class Schedules1758300000000 implements MigrationInterface {
    name = "Schedules1758300000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
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
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.schedule_event (
                id_event       SERIAL PRIMARY KEY,
                id_schedule    INTEGER NOT NULL REFERENCES users.schedule(id_schedule) ON DELETE CASCADE,
                id_area        INTEGER NOT NULL REFERENCES users.area(id_area),
                id_routine     INTEGER REFERENCES users.routine(id_routine),
                scheduled_at   TIMESTAMP NOT NULL,
                slot_key       VARCHAR(80) NOT NULL UNIQUE,
                status_event   INTEGER NOT NULL DEFAULT 1,
                created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_schedule_event_area ON users.schedule_event(id_area)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_schedule_event_scheduled ON users.schedule_event(scheduled_at)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS users.idx_schedule_event_scheduled`);
        await queryRunner.query(`DROP INDEX IF EXISTS users.idx_schedule_event_area`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.schedule_event`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.schedule`);
    }
}
