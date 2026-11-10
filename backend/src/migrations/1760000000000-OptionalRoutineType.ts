import { MigrationInterface, QueryRunner } from "typeorm";

export class OptionalRoutineType1760000000000 implements MigrationInterface {
    name = "OptionalRoutineType1760000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users.routine
            ALTER COLUMN id_routine_type DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users.routine
            ALTER COLUMN id_routine_type SET NOT NULL
        `);
    }
}