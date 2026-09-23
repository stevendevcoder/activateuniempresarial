import { Repository, SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { PausaEvent } from "./pausa-event.entity";
import { User } from "../../auth/repository/user.entity";
import { Area } from "../../areas/repository/area.entity";

export const TELEMETRY_EVENT = {
    INICIO: 1,
    FIN: 2,
    APLAZAMIENTO: 3,
    CANCELACION: 4,
} as const;

export type TelemetryEventType = (typeof TELEMETRY_EVENT)[keyof typeof TELEMETRY_EVENT];

export const TELEMETRY_LABELS: Record<number, string> = {
    [TELEMETRY_EVENT.INICIO]: "inicio",
    [TELEMETRY_EVENT.FIN]: "fin",
    [TELEMETRY_EVENT.APLAZAMIENTO]: "aplazamiento",
    [TELEMETRY_EVENT.CANCELACION]: "cancelacion",
};

export interface TelemetryRecord {
    id: number;
    idUser: number;
    userName: string | null;
    idPausa: number | null;
    idScheduleEvent: number | null;
    idArea: number | null;
    areaName: string | null;
    type: number;
    typeLabel: string;
    reason: string | null;
    occurredAt: string;
    createdAt: string;
}

export interface TelemetryInput {
    idPausa: number | null;
    idScheduleEvent: number | null;
    idArea: number | null;
    type: TelemetryEventType;
    reason: string | null;
    occurredAt: Date;
}

export interface TelemetryFilters {
    userId?: number;
    areaId?: number;
    type?: number;
    start?: string;
    end?: string;
    limit?: number;
}

export interface TelemetrySummaryRow {
    type: number;
    typeLabel: string;
    count: number;
}

function toIso(value: Date | string | null | undefined): string {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function toInt(value: string | number | null | undefined): number {
    const parsed = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}

export interface ITelemetryRepository {
    create(userId: number, input: TelemetryInput): Promise<number>;
    createMany(userId: number, inputs: TelemetryInput[]): Promise<number>;
    countByPausaAndType(idPausa: number, type: number): Promise<number>;
    listByUser(userId: number, filters: TelemetryFilters): Promise<TelemetryRecord[]>;
    list(filters: TelemetryFilters): Promise<TelemetryRecord[]>;
    summary(filters: TelemetryFilters): Promise<TelemetrySummaryRow[]>;
}

export class TelemetryRepository implements ITelemetryRepository {
    private repo: Repository<PausaEvent>;

    constructor() {
        this.repo = AppDataSource.getRepository(PausaEvent);
    }

    private toRecord(event: PausaEvent): TelemetryRecord {
        return {
            id: event.id_pausa_event,
            idUser: event.id_user,
            userName: event.user?.name_user ?? null,
            idPausa: event.id_pausa,
            idScheduleEvent: event.id_schedule_event,
            idArea: event.id_area,
            areaName: event.area?.name_area ?? null,
            type: event.event_type,
            typeLabel: TELEMETRY_LABELS[event.event_type] ?? "desconocido",
            reason: event.reason,
            occurredAt: toIso(event.occurred_at),
            createdAt: toIso(event.created_at),
        };
    }

    private applyFilters(qb: SelectQueryBuilder<PausaEvent>, filters: TelemetryFilters): void {
        if (filters.userId !== undefined) {
            qb.andWhere("e.id_user = :userId", { userId: filters.userId });
        }
        if (filters.areaId !== undefined) {
            qb.andWhere("e.id_area = :areaId", { areaId: filters.areaId });
        }
        if (filters.type !== undefined) {
            qb.andWhere("e.event_type = :type", { type: filters.type });
        }
        if (filters.start) {
            qb.andWhere("e.occurred_at >= :start", { start: filters.start });
        }
        if (filters.end) {
            qb.andWhere("e.occurred_at <= :end", { end: filters.end });
        }
    }

    async create(userId: number, input: TelemetryInput): Promise<number> {
        const entity = this.repo.create({
            id_user: userId,
            id_pausa: input.idPausa,
            id_schedule_event: input.idScheduleEvent,
            id_area: input.idArea,
            event_type: input.type,
            reason: input.reason,
            occurred_at: input.occurredAt,
        });
        const saved = await this.repo.save(entity);
        return saved.id_pausa_event;
    }

    async createMany(userId: number, inputs: TelemetryInput[]): Promise<number> {
        if (inputs.length === 0) return 0;
        const entities = inputs.map((input) =>
            this.repo.create({
                id_user: userId,
                id_pausa: input.idPausa,
                id_schedule_event: input.idScheduleEvent,
                id_area: input.idArea,
                event_type: input.type,
                reason: input.reason,
                occurred_at: input.occurredAt,
            })
        );
        const saved = await this.repo.save(entities);
        return saved.length;
    }

    async countByPausaAndType(idPausa: number, type: number): Promise<number> {
        return this.repo.count({ where: { id_pausa: idPausa, event_type: type } });
    }

    async listByUser(userId: number, filters: TelemetryFilters): Promise<TelemetryRecord[]> {
        const qb = this.repo
            .createQueryBuilder("e")
            .leftJoinAndSelect("e.area", "area")
            .leftJoinAndSelect("e.user", "user")
            .where("e.id_user = :userId", { userId })
            .orderBy("e.occurred_at", "DESC")
            .take(filters.limit ?? 100);

        if (filters.type !== undefined) {
            qb.andWhere("e.event_type = :type", { type: filters.type });
        }
        if (filters.start) {
            qb.andWhere("e.occurred_at >= :start", { start: filters.start });
        }
        if (filters.end) {
            qb.andWhere("e.occurred_at <= :end", { end: filters.end });
        }

        const rows = await qb.getMany();
        return rows.map((r) => this.toRecord(r));
    }

    async list(filters: TelemetryFilters): Promise<TelemetryRecord[]> {
        const qb = this.repo
            .createQueryBuilder("e")
            .leftJoinAndSelect("e.area", "area")
            .leftJoinAndSelect("e.user", "user")
            .orderBy("e.occurred_at", "DESC")
            .take(filters.limit ?? 100);

        this.applyFilters(qb, filters);
        const rows = await qb.getMany();
        return rows.map((r) => this.toRecord(r));
    }

    async summary(filters: TelemetryFilters): Promise<TelemetrySummaryRow[]> {
        const qb = this.repo
            .createQueryBuilder("e")
            .select("e.event_type", "type")
            .addSelect("COUNT(*)::int", "count")
            .groupBy("e.event_type")
            .orderBy("e.event_type", "ASC");

        this.applyFilters(qb, filters);
        const rows = await qb.getRawMany<{ type: number; count: number }>();

        return rows.map((r) => ({
            type: toInt(r.type),
            typeLabel: TELEMETRY_LABELS[toInt(r.type)] ?? "desconocido",
            count: toInt(r.count),
        }));
    }
}
