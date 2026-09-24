import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1758100000000 implements MigrationInterface {
    name = "InitialSchema1758100000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS users`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.role (
                id_role         SERIAL PRIMARY KEY,
                name_role       VARCHAR(100) NOT NULL UNIQUE,
                description_role VARCHAR(255) NOT NULL DEFAULT '',
                status_role     INTEGER NOT NULL DEFAULT 1
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.permission (
                id_permission       SERIAL PRIMARY KEY,
                name_permission     VARCHAR(100) NOT NULL UNIQUE,
                module_permission   VARCHAR(100) NOT NULL,
                description_permission VARCHAR(255) NOT NULL DEFAULT ''
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.role_permission (
                id_role         INTEGER NOT NULL REFERENCES users.role(id_role) ON DELETE CASCADE,
                id_permission   INTEGER NOT NULL REFERENCES users.permission(id_permission) ON DELETE CASCADE,
                PRIMARY KEY (id_role, id_permission)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users."user" (
                id_user      SERIAL PRIMARY KEY,
                name_user    VARCHAR(255) NOT NULL,
                email_user   VARCHAR(255) NOT NULL UNIQUE,
                password_user VARCHAR(255) NOT NULL,
                status_user  INTEGER NOT NULL DEFAULT 1,
                id_role      INTEGER REFERENCES users.role(id_role),
                id_area      INTEGER,
                photo_user   VARCHAR(500)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.area (
                id_area             SERIAL PRIMARY KEY,
                name_area           VARCHAR(255) NOT NULL,
                description_area    VARCHAR(255) NOT NULL DEFAULT '',
                id_responsible_user INTEGER REFERENCES users."user"(id_user),
                status_area         INTEGER NOT NULL DEFAULT 1
            )
        `);

        await queryRunner.query(`
            ALTER TABLE users."user"
                ADD CONSTRAINT fk_user_area FOREIGN KEY (id_area) REFERENCES users.area(id_area)
        `);

        await queryRunner.query(`
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
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.routine_type (
                id_routine_type       SERIAL PRIMARY KEY,
                name_routine_type     VARCHAR(100) NOT NULL,
                description_routine_type VARCHAR(255) NOT NULL DEFAULT '',
                icon_routine_type     VARCHAR(50) NOT NULL DEFAULT '',
                color_routine_type    VARCHAR(20) NOT NULL DEFAULT '',
                status_routine_type   INTEGER NOT NULL DEFAULT 1
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.routine (
                id_routine       SERIAL PRIMARY KEY,
                name_routine     VARCHAR(255) NOT NULL,
                description_routine VARCHAR(500) NOT NULL DEFAULT '',
                id_routine_type  INTEGER NOT NULL REFERENCES users.routine_type(id_routine_type),
                status_routine   INTEGER NOT NULL DEFAULT 1
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.routine_video (
                id_routine_video  SERIAL PRIMARY KEY,
                id_routine        INTEGER NOT NULL REFERENCES users.routine(id_routine) ON DELETE CASCADE,
                id_video          INTEGER NOT NULL REFERENCES users.video(id_video),
                duration_seconds  INTEGER NOT NULL,
                position          INTEGER NOT NULL
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS users.pausa (
                id_pausa      SERIAL PRIMARY KEY,
                id_user       INTEGER NOT NULL REFERENCES users."user"(id_user) ON DELETE CASCADE,
                id_routine    INTEGER REFERENCES users.routine(id_routine),
                id_area       INTEGER REFERENCES users.area(id_area),
                scheduled_at  TIMESTAMP NOT NULL DEFAULT NOW(),
                completed_at  TIMESTAMP,
                status_pausa  INTEGER NOT NULL DEFAULT 1
            )
        `);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pausa_user ON users.pausa(id_user)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pausa_area ON users.pausa(id_area)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pausa_scheduled ON users.pausa(scheduled_at)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pausa_status ON users.pausa(status_pausa)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS users.pausa`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.routine_video`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.routine`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.routine_type`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.video`);
        await queryRunner.query(`ALTER TABLE users."user" DROP CONSTRAINT IF EXISTS fk_user_area`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.area`);
        await queryRunner.query(`DROP TABLE IF EXISTS users."user"`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.role_permission`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.permission`);
        await queryRunner.query(`DROP TABLE IF EXISTS users.role`);
    }
}
