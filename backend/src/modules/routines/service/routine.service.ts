import { IRoutineRepository, RoutineCreateInput, RoutineRecord, RoutineUpdateInput } from "../repository/routine.repository";
import { IRoutineTypeRepository } from "../../routine-types/repository/routine-type.repository";
import { IVideoRepository } from "../../media/repository/video.repository";

export class RoutineService {
    private routineRepo: IRoutineRepository;
    private routineTypeRepo: IRoutineTypeRepository;
    private videoRepo: IVideoRepository;

    constructor(routineRepo: IRoutineRepository, routineTypeRepo: IRoutineTypeRepository, videoRepo: IVideoRepository) {
        this.routineRepo = routineRepo;
        this.routineTypeRepo = routineTypeRepo;
        this.videoRepo = videoRepo;
    }

    private async validateVideos(input: RoutineCreateInput): Promise<void> {
        for (const video of input.videos) {
            const existing = await this.videoRepo.findById(video.idVideo);
            if (!existing) {
                throw new Error(`El video con ID ${video.idVideo} no existe`);
            }
        }
    }

    async createRoutine(input: RoutineCreateInput): Promise<number> {
        const type = await this.routineTypeRepo.findById(input.idRoutineType);
        if (!type) {
            throw new Error("El tipo de rutina indicado no existe");
        }

        await this.validateVideos(input);
        return this.routineRepo.create(input);
    }

    async updateRoutine(id: number, input: RoutineUpdateInput): Promise<boolean> {
        const existing = await this.routineRepo.findById(id);
        if (!existing) {
            throw new Error("Rutina no encontrada");
        }
        if (input.idRoutineType) {
            const type = await this.routineTypeRepo.findById(input.idRoutineType);
            if (!type) {
                throw new Error("El tipo de rutina indicado no existe");
            }
        }
        if (input.videos) {
            await this.validateVideos({ name: existing.name, description: existing.description, idRoutineType: existing.idRoutineType, status: existing.status, videos: input.videos });
        }
        return this.routineRepo.update(id, input);
    }

    async deleteRoutine(id: number): Promise<boolean> {
        const existing = await this.routineRepo.findById(id);
        if (!existing) {
            throw new Error("Rutina no encontrada");
        }
        return this.routineRepo.delete(id);
    }

    async setRoutineStatus(id: number, status: number): Promise<boolean> {
        const existing = await this.routineRepo.findById(id);
        if (!existing) {
            throw new Error("Rutina no encontrada");
        }
        return this.routineRepo.setStatus(id, status);
    }

    async getRoutineById(id: number): Promise<RoutineRecord | null> {
        return this.routineRepo.findById(id);
    }

    async getAllRoutines(): Promise<RoutineRecord[]> {
        return this.routineRepo.findAll();
    }
}