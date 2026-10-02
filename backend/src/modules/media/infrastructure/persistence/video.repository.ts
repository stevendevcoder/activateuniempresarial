import { Repository } from "typeorm";
import { AppDataSource } from "../../../../config/data-base";
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

export type VideoUploadInput = VideoInput & { data: Buffer };

export type VideoUpdateInput = Partial<Omit<VideoRecord, "id">> & { data?: Buffer };

export interface VideoFileRecord {
    data: Buffer | null;
    filePath: string;
    mimeType: string;
}

export interface IVideoRepository {
    create(video: VideoUploadInput): Promise<number>;
    update(id: number, video: VideoUpdateInput): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    findById(id: number): Promise<VideoRecord | null>;
    findFileById(id: number): Promise<VideoFileRecord | null>;
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

    private toEntity(video: VideoUploadInput): Video {
        const entity = new Video();
        entity.title_video = video.title;
        entity.description_video = video.description;
        entity.file_name_video = video.fileName;
        entity.file_path_video = video.filePath;
        entity.video_data = video.data;
        entity.mime_type_video = video.mimeType;
        entity.size_video = video.size;
        entity.duration_seconds_video = video.durationSeconds;
        entity.status_video = video.status;
        return entity;
    }

    async create(video: VideoUploadInput): Promise<number> {
        const saved = await this.repo.save(this.toEntity(video));
        return saved.id_video;
    }

    async update(id: number, video: VideoUpdateInput): Promise<boolean> {
        const changes: Partial<Video> = {};
        if (video.title !== undefined) changes.title_video = video.title;
        if (video.description !== undefined) changes.description_video = video.description;
        if (video.mimeType !== undefined) changes.mime_type_video = video.mimeType;
        if (video.fileName !== undefined) changes.file_name_video = video.fileName;
        if (video.filePath !== undefined) changes.file_path_video = video.filePath;
        if (video.data !== undefined) changes.video_data = video.data;
        if (video.size !== undefined) changes.size_video = video.size;
        if (video.durationSeconds !== undefined) changes.duration_seconds_video = video.durationSeconds;
        if (video.status !== undefined) changes.status_video = video.status;

        const result = await this.repo.update({ id_video: id }, changes);
        return (result.affected ?? 0) > 0;
    }

    async delete(id: number): Promise<boolean> {
        return this.update(id, { status: 0 });
    }

    async findById(id: number): Promise<VideoRecord | null> {
        const video = await this.repo.findOne({
            where: { id_video: id },
            select: {
                id_video: true,
                title_video: true,
                description_video: true,
                file_name_video: true,
                file_path_video: true,
                mime_type_video: true,
                size_video: true,
                duration_seconds_video: true,
                status_video: true,
            },
        });
        return video ? this.toRecord(video) : null;
    }

    async findFileById(id: number): Promise<VideoFileRecord | null> {
        const video = await this.repo.findOne({
            where: { id_video: id },
            select: { video_data: true, file_path_video: true, mime_type_video: true },
        });
        return video
            ? { data: video.video_data, filePath: video.file_path_video, mimeType: video.mime_type_video }
            : null;
    }

    async findAll(): Promise<VideoRecord[]> {
        const videos = await this.repo.find({
            order: { id_video: "DESC" },
            select: {
                id_video: true,
                title_video: true,
                description_video: true,
                file_name_video: true,
                file_path_video: true,
                mime_type_video: true,
                size_video: true,
                duration_seconds_video: true,
                status_video: true,
            },
        });
        return videos.map((v) => this.toRecord(v));
    }

    async countByStatus(status: number): Promise<number> {
        return this.repo.count({ where: { status_video: status } });
    }
}