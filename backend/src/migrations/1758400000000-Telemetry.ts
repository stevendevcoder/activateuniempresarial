import { MigrationInterface, QueryRunner } from "typeorm";

export class Telemetry1758400000000 implements MigrationInterface {
    name = "Telemetry1758400000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
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
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_pausa_event_user ON users.pausa_event(id_user)
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_pausa_event_occurred ON users.pausa_event(occurred_at)
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION users.prevent_pausa_event_mutation()
            RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'La tabla pausa_event es inmutable (EP13)';
            END;
            $$ LANGUAGE plpgsql
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trg_pausa_event_immutable ON users.pausa_event
        `);
        await queryRunner.query(`
            CREATE TRIGGER trg_pausa_event_immutable
            BEFORE UPDATE OR DELETE ON users.pausa_event
            FOR EACH ROW EXECUTE FUNCTION users.prevent_pausa_event_mutation()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS trg_pausa_event_immutable ON users.pausa_event`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS users.prevent_pausa_event_mutation`);
        await queryRunner.query(`DROP INDEX IF EXISTS users.idx_pausa_event_occurred`);
        await queryRunner.query(`DROP INDEX IF EXISTS users.idx_pausa_event_user`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.pausa_event`);
    }
}
