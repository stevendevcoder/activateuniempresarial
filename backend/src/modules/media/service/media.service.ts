import fs from "fs/promises";
import { Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { RoutineVideo } from "../../routines/repository/routine-video.entity";
import { IVideoRepository, VideoInput, VideoRecord, VideoUpdateInput } from "../repository/video.repository";
import { MEDIA_UPLOAD_DIR } from "../../../config/media";

export class MediaService {
    private videoRepo: IVideoRepository;
    private routineVideoRepo: Repository<RoutineVideo>;

    constructor(videoRepo: IVideoRepository) {
        this.videoRepo = videoRepo;
        this.routineVideoRepo = AppDataSource.getRepository(RoutineVideo);
    }

    async createVideo(video: VideoInput): Promise<number> {
        return this.videoRepo.create(video);
    }

    async updateVideo(id: number, data: VideoUpdateInput): Promise<boolean> {
        const existing = await this.videoRepo.findById(id);
        if (!existing) {
            throw new Error("Video no encontrado");
        }
        return this.videoRepo.update(id, data);
    }

    async replaceFile(id: number, file: { fileName: string; filePath: string; mimeType: string; size: number }): Promise<boolean> {
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

    async getFilePath(id: number): Promise<{ filePath: string; mimeType: string } | null> {
        const video = await this.videoRepo.findById(id);
        if (!video) return null;

        const filePath = this.buildFilePath(video.filePath);
        if (!filePath) return null;

        return { filePath, mimeType: video.mimeType };
    }

    async getAllVideos(): Promise<VideoRecord[]> {
        return this.videoRepo.findAll();
    }

    private buildFilePath(storedPath: string): string | null {
        const base = MEDIA_UPLOAD_DIR.replace(/\/+$/, "");
        const cleaned = storedPath.startsWith("/") ? storedPath : `/${storedPath}`;
        if (cleaned.startsWith(base)) {
            return cleaned;
        }
        if (cleaned.includes("..")) {
            return null;
        }
        return `${base}${cleaned}`;
    }
}