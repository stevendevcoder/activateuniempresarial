import { readFile } from "node:fs/promises";
import path from "node:path";
import { MigrationInterface, QueryRunner } from "typeorm";

export class VideoBinaryStorage1760100000000 implements MigrationInterface {
    name = "VideoBinaryStorage1760100000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users.video
            ADD COLUMN IF NOT EXISTS video_data BYTEA
        `);

        const uploadDirectory = path.resolve(process.env.MEDIA_UPLOAD_DIR ?? "./uploads");
        const videos: { id_video: number; file_path_video: string; file_name_video: string }[] = await queryRunner.query(`
            SELECT id_video, file_path_video, file_name_video
            FROM users.video
            WHERE video_data IS NULL
        `);

        for (const video of videos) {
            const fileName = (video.file_path_video || video.file_name_video)
                .replace(/\\/g, "/")
                .split("/")
                .pop();
            if (!fileName) continue;

            const filePath = path.resolve(uploadDirectory, fileName);
            const relativePath = path.relative(uploadDirectory, filePath);
            if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) continue;

            try {
                const data = await readFile(filePath);
                await queryRunner.query(
                    `UPDATE users.video SET video_data = $1 WHERE id_video = $2`,
                    [data, video.id_video],
                );
            } catch {
                // Keep legacy path-based playback for files not present on this server.
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users.video DROP COLUMN IF EXISTS video_data`);
    }
}