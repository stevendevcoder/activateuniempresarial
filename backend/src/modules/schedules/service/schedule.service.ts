import { IAreaRepository } from "../../areas/repository/area.repository";
import { IRoutineRepository } from "../../routines/repository/routine.repository";
import { minutesFromTime } from "../../../utils/timezone";
import {
    IScheduleRepository,
    ScheduleEventFilters,
    ScheduleEventRecord,
    ScheduleInput,
    ScheduleRecord,
} from "../repository/schedule.repository";

export class ScheduleService {
    private scheduleRepo: IScheduleRepository;
    private areaRepo: IAreaRepository;
    private routineRepo: IRoutineRepository;

    constructor(
        scheduleRepo: IScheduleRepository,
        areaRepo: IAreaRepository,
        routineRepo: IRoutineRepository
    ) {
        this.scheduleRepo = scheduleRepo;
        this.areaRepo = areaRepo;
        this.routineRepo = routineRepo;
    }

    private async validateArea(idArea: number): Promise<void> {
        const area = await this.areaRepo.findById(idArea);
        if (!area) {
            throw new Error("El área indicada no existe");
        }
    }

    private async validateRoutine(idRoutine: number | null): Promise<void> {
        if (idRoutine == null) return;
        const routine = await this.routineRepo.findById(idRoutine);
        if (!routine) {
            throw new Error("La rutina indicada no existe");
        }
    }

    private validateWindow(startTime: string, endTime: string): void {
        if (minutesFromTime(startTime) >= minutesFromTime(endTime)) {
            throw new Error("La hora de fin debe ser posterior a la hora de inicio");
        }
    }

    async createSchedule(input: ScheduleInput): Promise<number> {
        await this.validateArea(input.idArea);
        await this.validateRoutine(input.idRoutine);
        this.validateWindow(input.startTime, input.endTime);

        const existing = await this.scheduleRepo.findByArea(input.idArea);
        if (existing) {
            throw new Error("El área ya tiene un cronograma configurado");
        }

        return this.scheduleRepo.create(input);
    }

    async updateSchedule(id: number, input: Partial<ScheduleInput>): Promise<boolean> {
        const existing = await this.scheduleRepo.findById(id);
        if (!existing) {
            throw new Error("Cronograma no encontrado");
        }

        if (input.idArea !== undefined && input.idArea !== existing.idArea) {
            await this.validateArea(input.idArea);
            const taken = await this.scheduleRepo.findByArea(input.idArea);
            if (taken) {
                throw new Error("El área ya tiene un cronograma configurado");
            }
        }
        if (input.idRoutine !== undefined) {
            await this.validateRoutine(input.idRoutine);
        }

        const startTime = input.startTime ?? existing.startTime;
        const endTime = input.endTime ?? existing.endTime;
        this.validateWindow(startTime, endTime);

        return this.scheduleRepo.update(id, input);
    }

    async deleteSchedule(id: number): Promise<boolean> {
        const existing = await this.scheduleRepo.findById(id);
        if (!existing) {
            throw new Error("Cronograma no encontrado");
        }
        return this.scheduleRepo.delete(id);
    }

    async pauseSchedule(id: number): Promise<boolean> {
        const existing = await this.scheduleRepo.findById(id);
        if (!existing) {
            throw new Error("Cronograma no encontrado");
        }
        return this.scheduleRepo.setPaused(id, true);
    }

    async resumeSchedule(id: number): Promise<boolean> {
        const existing = await this.scheduleRepo.findById(id);
        if (!existing) {
            throw new Error("Cronograma no encontrado");
        }
        return this.scheduleRepo.setPaused(id, false);
    }

    async getScheduleById(id: number): Promise<ScheduleRecord | null> {
        return this.scheduleRepo.findById(id);
    }

    async getScheduleByArea(idArea: number): Promise<ScheduleRecord | null> {
        return this.scheduleRepo.findByArea(idArea);
    }

    async getAllSchedules(): Promise<ScheduleRecord[]> {
        return this.scheduleRepo.findAll();
    }

    async listEvents(filters: ScheduleEventFilters): Promise<ScheduleEventRecord[]> {
        return this.scheduleRepo.listEvents(filters);
    }
}
