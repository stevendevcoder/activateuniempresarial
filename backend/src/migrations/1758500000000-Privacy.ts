import { MigrationInterface, QueryRunner } from "typeorm";

export class Privacy1758500000000 implements MigrationInterface {
    name = "Privacy1758500000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users."user"
            ADD COLUMN IF NOT EXISTS anonymized_user BOOLEAN NOT NULL DEFAULT FALSE
        `);

        await queryRunner.query(`
            ALTER TABLE users.global_config
            ADD COLUMN IF NOT EXISTS retention_months INTEGER NOT NULL DEFAULT 24
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.consent (
                id_consent      SERIAL PRIMARY KEY,
                id_user         INTEGER NOT NULL REFERENCES users."user"(id_user) ON DELETE CASCADE,
                version_consent VARCHAR(20) NOT NULL DEFAULT '1.0',
                accepted_consent BOOLEAN NOT NULL DEFAULT TRUE,
                accepted_at     TIMESTAMP NOT NULL,
                revoked_at      TIMESTAMP,
                created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_consent_user ON users.consent(id_user)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS users.idx_consent_user`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.consent`);
        await queryRunner.query(`ALTER TABLE users.global_config DROP COLUMN IF EXISTS retention_months`);
        await queryRunner.query(`ALTER TABLE users."user" DROP COLUMN IF EXISTS anonymized_user`);
    }
}
