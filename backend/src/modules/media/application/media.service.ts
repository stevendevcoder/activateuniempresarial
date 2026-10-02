import fs from "fs/promises";
import path from "path";
import { Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { RoutineVideo } from "../../routines/infrastructure/persistence/routine-video.entity";
import { IVideoRepository, VideoRecord, VideoUpdateInput, VideoUploadInput } from "../infrastructure/persistence/video.repository";
import { MEDIA_UPLOAD_DIR } from "../../../config/media";

export class MediaService {
    private videoRepo: IVideoRepository;
    private routineVideoRepo: Repository<RoutineVideo>;

    constructor(videoRepo: IVideoRepository) {
        this.videoRepo = videoRepo;
        this.routineVideoRepo = AppDataSource.getRepository(RoutineVideo);
    }

    async createVideo(video: VideoUploadInput): Promise<number> {
        return this.videoRepo.create(video);
    }

    async updateVideo(id: number, data: VideoUpdateInput): Promise<boolean> {
        const existing = await this.videoRepo.findById(id);
        if (!existing) {
            throw new Error("Video no encontrado");
        }
        return this.videoRepo.update(id, data);
    }

    async replaceFile(id: number, file: { fileName: string; filePath: string; mimeType: string; size: number; data: Buffer }): Promise<boolean> {
        const existing = await this.videoRepo.findById(id);
        if (!existing) {
            throw new Error("Video no encontrado");
        }

        const oldPath = this.buildFilePath(existing.filePath);
        if (oldPath && oldPath !== file.filePath) {
            await fs.unlink(oldPath).catch(() => undefined);
        }

        return this.videoRepo.update(id, {
            fileName: file.fileName,
            filePath: file.filePath,
            mimeType: file.mimeType,
            size: file.size,
            data: file.data,
        });
    }

    async deleteVideo(id: number): Promise<boolean> {
        const existing = await this.videoRepo.findById(id);
        if (!existing) {
            throw new Error("Video no encontrado");
        }

        const references = await this.routineVideoRepo.count({ where: { id_video: id } });
        if (references > 0) {
            throw new Error("El video está asignado a una o más rutinas");
        }

        const removed = await this.videoRepo.delete(id);
        if (removed) {
            const filePath = this.buildFilePath(existing.filePath);
            if (filePath) {
                await fs.unlink(filePath).catch(() => undefined);
            }
        }
        return removed;
    }

    async getVideoById(id: number): Promise<VideoRecord | null> {
        return this.videoRepo.findById(id);
    }

    async getVideoFile(id: number): Promise<{ data: Buffer; mimeType: string } | null> {
        const video = await this.videoRepo.findFileById(id);
        if (!video) return null;

        if (video.data) return { data: video.data, mimeType: video.mimeType };

        const filePath = this.buildFilePath(video.filePath);
        if (!filePath) return null;
        try {
            return { data: await fs.readFile(filePath), mimeType: video.mimeType };
        } catch {
            return null;
        }
    }

    async getAllVideos(): Promise<VideoRecord[]> {
        return this.videoRepo.findAll();
    }

    /**
     * Resuelve la ruta de videos legados guardados en disco (absoluta de multer o relativa al
     * directorio de subidas) para que funcione igual en Windows y Linux. Los videos nuevos se
     * guardan en la BD con ruta vacía. Devuelve null si no hay ruta o si sale del directorio.
     */
    private buildFilePath(storedPath: string): string | null {
        if (!storedPath) return null;
        const base = path.resolve(MEDIA_UPLOAD_DIR);
        const resolved = path.resolve(path.isAbsolute(storedPath) ? storedPath : path.join(base, storedPath.replace(/^[/\\]+/, "")));
        const relative = path.relative(base, resolved);
        if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) return null;
        return resolved;
    }
}