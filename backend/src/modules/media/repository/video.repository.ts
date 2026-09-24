import { Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { Video } from "./video.entity";

export interface VideoRecord {
    id: number;
    title: string;
    description: string;
    fileName: string;
    filePath: string;
    mimeType: string;
    size: number;
    durationSeconds: number;
    status: number;
}

export type VideoInput = Omit<VideoRecord, "id">;

export type VideoUpdateInput = Partial<Omit<VideoRecord, "id">>;

export interface IVideoRepository {
    create(video: VideoInput): Promise<number>;
    update(id: number, video: VideoUpdateInput): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    findById(id: number): Promise<VideoRecord | null>;
    findAll(): Promise<VideoRecord[]>;
    countByStatus(status: number): Promise<number>;
}

export class VideoRepository implements IVideoRepository {
    private repo: Repository<Video>;

    constructor() {
        this.repo = AppDataSource.getRepository(Video);
    }

    private toRecord(video: Video): VideoRecord {
        return {
            id: video.id_video,
            title: video.title_video,
            description: video.description_video,
            fileName: video.file_name_video,
            filePath: video.file_path_video,
            mimeType: video.mime_type_video,
            size: video.size_video,
            durationSeconds: video.duration_seconds_video,
            status: video.status_video,
        };
    }

    private toEntity(video: VideoInput): Video {
        const entity = new Video();
        entity.title_video = video.title;
        entity.description_video = video.description;
        entity.file_name_video = video.fileName;
        entity.file_path_video = video.filePath;
        entity.mime_type_video = video.mimeType;
        entity.size_video = video.size;
        entity.duration_seconds_video = video.durationSeconds;
        entity.status_video = video.status;
        return entity;
    }

    async create(video: VideoInput): Promise<number> {
        const saved = await this.repo.save(this.toEntity(video));
        return saved.id_video;
    }

    async update(id: number, video: VideoUpdateInput): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_video: id } });
        if (!existing) return false;

        Object.assign(existing, {
            title_video: video.title ?? existing.title_video,
            description_video: video.description ?? existing.description_video,
            mime_type_video: video.mimeType ?? existing.mime_type_video,
            file_name_video: video.fileName ?? existing.file_name_video,
            file_path_video: video.filePath ?? existing.file_path_video,
            size_video: video.size ?? existing.size_video,
            duration_seconds_video: video.durationSeconds ?? existing.duration_seconds_video,
            status_video: video.status ?? existing.status_video,
        });

        await this.repo.save(existing);
        return true;
    }

    async delete(id: number): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_video: id } });
        if (!existing) return false;

        existing.status_video = 0;
        await this.repo.save(existing);
        return true;
    }

    async findById(id: number): Promise<VideoRecord | null> {
        const video = await this.repo.findOne({ where: { id_video: id } });
        return video ? this.toRecord(video) : null;
    }

    async findAll(): Promise<VideoRecord[]> {
        const videos = await this.repo.find({ order: { id_video: "DESC" } });
        return videos.map((v) => this.toRecord(v));
    }

    async countByStatus(status: number): Promise<number> {
        return this.repo.count({ where: { status_video: status } });
    }
}