import { In, Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { Routine } from "./routine.entity";
import { RoutineVideo } from "./routine-video.entity";

export interface RoutineVideoRecord {
    id: number;
    idRoutine: number;
    idVideo: number;
    videoTitle: string | null;
    videoDuration: number;
    position: number;
}

export interface RoutineRecord {
    id: number;
    name: string;
    description: string;
    idRoutineType: number;
    routineTypeName: string | null;
    status: number;
    totalDurationSeconds: number;
    videos: RoutineVideoRecord[];
}

export interface RoutineVideoInput {
    idVideo: number;
    durationSeconds: number;
}

export interface RoutineCreateInput {
    name: string;
    description: string;
    idRoutineType: number;
    status: number;
    videos: RoutineVideoInput[];
}

export type RoutineUpdateInput = Partial<
    Omit<RoutineCreateInput, "idRoutineType" | "status" | "videos">
> & {
    idRoutineType?: number;
    status?: number;
    videos?: RoutineVideoInput[];
};

export interface IRoutineRepository {
    create(input: RoutineCreateInput): Promise<number>;
    update(id: number, input: RoutineUpdateInput): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    setStatus(id: number, status: number): Promise<boolean>;
    findById(id: number): Promise<RoutineRecord | null>;
    findAll(): Promise<RoutineRecord[]>;
}

export class RoutineRepository implements IRoutineRepository {
    private repo: Repository<Routine>;
    private routineVideoRepo: Repository<RoutineVideo>;

    constructor() {
        this.repo = AppDataSource.getRepository(Routine);
        this.routineVideoRepo = AppDataSource.getRepository(RoutineVideo);
    }

    private toVideoRecord(item: RoutineVideo): RoutineVideoRecord {
        return {
            id: item.id_routine_video,
            idRoutine: item.id_routine,
            idVideo: item.id_video,
            videoTitle: item.video?.title_video ?? null,
            videoDuration: item.duration_seconds,
            position: item.position,
        };
    }

    private toRecord(routine: Routine, videos: RoutineVideo[]): RoutineRecord {
        const videoRecords = videos.map((v) => this.toVideoRecord(v));
        return {
            id: routine.id_routine,
            name: routine.name_routine,
            description: routine.description_routine,
            idRoutineType: routine.id_routine_type,
            routineTypeName: routine.routineType?.name_routine_type ?? null,
            status: routine.status_routine,
            totalDurationSeconds: videoRecords.reduce((acc, v) => acc + v.videoDuration, 0),
            videos: videoRecords,
        };
    }

    async create(input: RoutineCreateInput): Promise<number> {
        return AppDataSource.transaction(async (manager) => {
            const routine = new Routine();
            routine.name_routine = input.name;
            routine.description_routine = input.description;
            routine.id_routine_type = input.idRoutineType;
            routine.status_routine = input.status;
            const saved = await manager.save(Routine, routine);

            const videoEntities = input.videos.map((video, index) => {
                const item = new RoutineVideo();
                item.id_routine = saved.id_routine;
                item.id_video = video.idVideo;
                item.duration_seconds = video.durationSeconds;
                item.position = index + 1;
                return item;
            });
            await manager.save(RoutineVideo, videoEntities);

            return saved.id_routine;
        });
    }

    async update(id: number, input: RoutineUpdateInput): Promise<boolean> {
        return AppDataSource.transaction(async (manager) => {
            const routine = await manager.findOne(Routine, { where: { id_routine: id } });
            if (!routine) return false;

            Object.assign(routine, {
                name_routine: input.name ?? routine.name_routine,
                description_routine: input.description ?? routine.description_routine,
                id_routine_type: input.idRoutineType ?? routine.id_routine_type,
                status_routine: input.status ?? routine.status_routine,
            });
            await manager.save(Routine, routine);

            if (input.videos) {
                await manager.delete(RoutineVideo, { id_routine: id });

                const videoEntities = input.videos.map((video, index) => {
                    const item = new RoutineVideo();
                    item.id_routine = id;
                    item.id_video = video.idVideo;
                    item.duration_seconds = video.durationSeconds;
                    item.position = index + 1;
                    return item;
                });
                await manager.save(RoutineVideo, videoEntities);
            }

            return true;
        });
    }

    async delete(id: number): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_routine: id } });
        if (!existing) return false;

        existing.status_routine = 0;
        await this.repo.save(existing);
        return true;
    }

    async setStatus(id: number, status: number): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_routine: id } });
        if (!existing) return false;

        existing.status_routine = status;
        await this.repo.save(existing);
        return true;
    }

    async findById(id: number): Promise<RoutineRecord | null> {
        const routine = await this.repo.findOne({
            where: { id_routine: id },
            relations: { routineType: true },
        });
        if (!routine) return null;

        const videos = await this.routineVideoRepo
            .createQueryBuilder("item")
            .leftJoinAndSelect("item.video", "video")
            .where("item.id_routine = :id", { id })
            .orderBy("item.position", "ASC")
            .getMany();

        return this.toRecord(routine, videos);
    }

    async findAll(): Promise<RoutineRecord[]> {
        const routines = await this.repo.find({
            relations: { routineType: true },
            order: { id_routine: "ASC" },
        });
        if (routines.length === 0) return [];

        const routineIds = routines.map((r) => r.id_routine);
        const items = await this.routineVideoRepo
            .createQueryBuilder("item")
            .leftJoinAndSelect("item.video", "video")
            .where("item.id_routine IN (:...ids)", { ids: routineIds })
            .orderBy("item.id_routine", "ASC")
            .addOrderBy("item.position", "ASC")
            .getMany();

        const groups = new Map<number, RoutineVideo[]>();
        for (const item of items) {
            const list = groups.get(item.id_routine) ?? [];
            list.push(item);
            groups.set(item.id_routine, list);
        }

        return routines.map((routine) => this.toRecord(routine, groups.get(routine.id_routine) ?? []));
    }
}