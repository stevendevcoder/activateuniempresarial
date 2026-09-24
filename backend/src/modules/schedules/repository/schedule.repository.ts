import { Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { Schedule } from "./schedule.entity";
import { ScheduleEvent } from "./schedule-event.entity";

export interface ScheduleRecord {
    id: number;
    idArea: number;
    areaName: string | null;
    idRoutine: number | null;
    routineName: string | null;
    startTime: string;
    endTime: string;
    frequencyMinutes: number;
    durationMinutes: number;
    daysOfWeek: number[];
    paused: boolean;
    status: number;
}

export interface ScheduleInput {
    idArea: number;
    idRoutine: number | null;
    startTime: string;
    endTime: string;
    frequencyMinutes: number;
    durationMinutes: number;
    daysOfWeek: number[];
    status: number;
}

export interface ScheduleEventRecord {
    id: number;
    idSchedule: number;
    idArea: number;
    areaName: string | null;
    idRoutine: number | null;
    scheduledAt: string;
    status: number;
    createdAt: string;
}

export interface ScheduleEventInput {
    idSchedule: number;
    idArea: number;
    idRoutine: number | null;
    scheduledAt: Date;
    slotKey: string;
}

export interface ScheduleEventFilters {
    areaId?: number;
    start?: string;
    end?: string;
    limit?: number;
}

function toIso(value: Date | string | null | undefined): string {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function parseDays(value: string): number[] {
    return value
        .split(",")
        .map((v) => Number.parseInt(v.trim(), 10))
        .filter((v) => !Number.isNaN(v));
}

export interface IScheduleRepository {
    create(input: ScheduleInput): Promise<number>;
    update(id: number, input: Partial<ScheduleInput>): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    setPaused(id: number, paused: boolean): Promise<boolean>;
    findById(id: number): Promise<ScheduleRecord | null>;
    findByArea(idArea: number): Promise<ScheduleRecord | null>;
    findAll(): Promise<ScheduleRecord[]>;
    listRunnable(): Promise<ScheduleRecord[]>;
    createEvent(input: ScheduleEventInput): Promise<number | null>;
    listEvents(filters: ScheduleEventFilters): Promise<ScheduleEventRecord[]>;
}

export class ScheduleRepository implements IScheduleRepository {
    private repo: Repository<Schedule>;
    private eventRepo: Repository<ScheduleEvent>;

    constructor() {
        this.repo = AppDataSource.getRepository(Schedule);
        this.eventRepo = AppDataSource.getRepository(ScheduleEvent);
    }

    private toRecord(schedule: Schedule): ScheduleRecord {
        return {
            id: schedule.id_schedule,
            idArea: schedule.id_area,
            areaName: schedule.area?.name_area ?? null,
            idRoutine: schedule.id_routine,
            routineName: schedule.routine?.name_routine ?? null,
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            frequencyMinutes: schedule.frequency_minutes,
            durationMinutes: schedule.duration_minutes,
            daysOfWeek: parseDays(schedule.days_of_week),
            paused: schedule.paused_schedule,
            status: schedule.status_schedule,
        };
    }

    private toEventRecord(event: ScheduleEvent): ScheduleEventRecord {
        return {
            id: event.id_event,
            idSchedule: event.id_schedule,
            idArea: event.id_area,
            areaName: event.area?.name_area ?? null,
            idRoutine: event.id_routine,
            scheduledAt: toIso(event.scheduled_at),
            status: event.status_event,
            createdAt: toIso(event.created_at),
        };
    }

    async create(input: ScheduleInput): Promise<number> {
        const entity = this.repo.create({
            id_area: input.idArea,
            id_routine: input.idRoutine,
            start_time: input.startTime,
            end_time: input.endTime,
            frequency_minutes: input.frequencyMinutes,
            duration_minutes: input.durationMinutes,
            days_of_week: input.daysOfWeek.join(","),
            status_schedule: input.status,
            paused_schedule: false,
        });
        const saved = await this.repo.save(entity);
        return saved.id_schedule;
    }

    async update(id: number, input: Partial<ScheduleInput>): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_schedule: id } });
        if (!existing) return false;

        if (input.idArea !== undefined) existing.id_area = input.idArea;
        if (input.idRoutine !== undefined) existing.id_routine = input.idRoutine;
        if (input.startTime !== undefined) existing.start_time = input.startTime;
        if (input.endTime !== undefined) existing.end_time = input.endTime;
        if (input.frequencyMinutes !== undefined) existing.frequency_minutes = input.frequencyMinutes;
        if (input.durationMinutes !== undefined) existing.duration_minutes = input.durationMinutes;
        if (input.daysOfWeek !== undefined) existing.days_of_week = input.daysOfWeek.join(",");
        if (input.status !== undefined) existing.status_schedule = input.status;

        await this.repo.save(existing);
        return true;
    }

    async delete(id: number): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_schedule: id } });
        if (!existing) return false;
        existing.status_schedule = 0;
        await this.repo.save(existing);
        return true;
    }

    async setPaused(id: number, paused: boolean): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_schedule: id } });
        if (!existing) return false;
        existing.paused_schedule = paused;
        await this.repo.save(existing);
        return true;
    }

    async findById(id: number): Promise<ScheduleRecord | null> {
        const schedule = await this.repo.findOne({
            where: { id_schedule: id },
            relations: { area: true, routine: true },
        });
        return schedule ? this.toRecord(schedule) : null;
    }

    async findByArea(idArea: number): Promise<ScheduleRecord | null> {
        const schedule = await this.repo.findOne({
            where: { id_area: idArea },
            relations: { area: true, routine: true },
        });
        return schedule ? this.toRecord(schedule) : null;
    }

    async findAll(): Promise<ScheduleRecord[]> {
        const schedules = await this.repo.find({
            where: { status_schedule: 1 },
            relations: { area: true, routine: true },
            order: { id_schedule: "ASC" },
        });
        return schedules.map((s) => this.toRecord(s));
    }

    async listRunnable(): Promise<ScheduleRecord[]> {
        const schedules = await this.repo.find({
            where: { status_schedule: 1, paused_schedule: false },
            relations: { area: true, routine: true },
        });
        return schedules.map((s) => this.toRecord(s));
    }

    async createEvent(input: ScheduleEventInput): Promise<number | null> {
        const result = await this.eventRepo
            .createQueryBuilder()
            .insert()
            .into(ScheduleEvent)
            .values({
                id_schedule: input.idSchedule,
                id_area: input.idArea,
                id_routine: input.idRoutine,
                scheduled_at: input.scheduledAt,
                slot_key: input.slotKey,
                status_event: 1,
            })
            .orIgnore()
            .returning("id_event")
            .execute();

        const raw = result.raw as { id_event: number }[] | undefined;
        const inserted = raw?.[0]?.id_event;
        return inserted ?? null;
    }

    async listEvents(filters: ScheduleEventFilters): Promise<ScheduleEventRecord[]> {
        const qb = this.eventRepo
            .createQueryBuilder("e")
            .leftJoinAndSelect("e.area", "area")
            .leftJoinAndSelect("e.routine", "routine")
            .orderBy("e.scheduled_at", "DESC");

        if (filters.areaId !== undefined) {
            qb.andWhere("e.id_area = :areaId", { areaId: filters.areaId });
        }
        if (filters.start) {
            qb.andWhere("e.scheduled_at >= :start", { start: filters.start });
        }
        if (filters.end) {
            qb.andWhere("e.scheduled_at <= :end", { end: filters.end });
        }
        qb.take(filters.limit ?? 100);

        const events = await qb.getMany();
        return events.map((e) => this.toEventRecord(e));
    }
}
