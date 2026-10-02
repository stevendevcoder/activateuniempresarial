import { MigrationInterface, QueryRunner } from "typeorm";

export class PasswordResetAndPush1758600000000 implements MigrationInterface {
    name = "PasswordResetAndPush1758600000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.password_reset (
                id_reset    SERIAL PRIMARY KEY,
                id_user     INTEGER NOT NULL REFERENCES users."user"(id_user) ON DELETE CASCADE,
                token_hash  VARCHAR(64) NOT NULL UNIQUE,
                expires_at  TIMESTAMPTZ NOT NULL,
                used_at     TIMESTAMPTZ,
                created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_password_reset_user ON users.password_reset(id_user)
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.push_subscription (
                id_subscription SERIAL PRIMARY KEY,
                id_user         INTEGER NOT NULL REFERENCES users."user"(id_user) ON DELETE CASCADE,
                endpoint        TEXT NOT NULL UNIQUE,
                p256dh          VARCHAR(255) NOT NULL,
                auth            VARCHAR(255) NOT NULL,
                user_agent      VARCHAR(255),
                created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_push_subscription_user ON users.push_subscription(id_user)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS users.idx_push_subscription_user`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.push_subscription`);
        await queryRunner.query(`DROP INDEX IF EXISTS users.idx_password_reset_user`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.password_reset`);
    }
}
