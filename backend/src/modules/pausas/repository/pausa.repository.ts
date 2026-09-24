import { Repository, SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import envs from "../../../config/environment-vars";
import { Pausa } from "./pausa.entity";
import { User } from "../../auth/repository/user.entity";
import { Area } from "../../areas/repository/area.entity";
import { Role } from "../../roles/repository/role.entity";
import { ADMIN_ROLE_NAME } from "../../../config/permissions";
import { formatDateInTz, zonedDateTime } from "../../../utils/timezone";

export const PAUSA_STATUS = {
    PROGRAMADA: 1,
    COMPLETADA: 2,
    APLAZADA: 3,
    CANCELADA: 4,
} as const;

export type PausaStatus = (typeof PAUSA_STATUS)[keyof typeof PAUSA_STATUS];

export const PAUSA_STATUS_LABELS: Record<number, string> = {
    [PAUSA_STATUS.PROGRAMADA]: "Programada",
    [PAUSA_STATUS.COMPLETADA]: "Completada",
    [PAUSA_STATUS.APLAZADA]: "Aplazada",
    [PAUSA_STATUS.CANCELADA]: "Cancelada",
};

export interface PausaRecord {
    id: number;
    idUser: number;
    userName: string | null;
    idRoutine: number | null;
    routineName: string | null;
    idArea: number | null;
    areaName: string | null;
    scheduledAt: string;
    completedAt: string | null;
    status: number;
}

export interface PausaCreateInput {
    userId: number;
    routineId: number | null;
    areaId: number | null;
    scheduledAt: Date;
    completedAt?: Date | null;
    status: PausaStatus;
}

export interface PausaUpdateInput {
    status?: PausaStatus;
    completedAt?: Date | null;
}

export interface AnalyticsFilters {
    areaId?: number;
    start?: string;
    end?: string;
}

export interface UserHistoryFilters {
    status?: number;
    limit?: number;
    offset?: number;
    start?: string;
    end?: string;
}

export interface AnalyticsSummary {
    total: number;
    programadas: number;
    completadas: number;
    aplazadas: number;
    canceladas: number;
    colaboradores: number;
    activeWorkers: number;
    activeAreas: number;
}

export interface TimelinePoint {
    period: string;
    total: number;
    programadas: number;
    completadas: number;
    aplazadas: number;
    canceladas: number;
}

export interface AreaComplianceRow {
    idArea: number | null;
    areaName: string;
    total: number;
    completadas: number;
    canceladas: number;
    colaboradores: number;
    complianceRate: number;
    workers: number;
}

export interface UserComplianceRow {
    idUser: number;
    name: string;
    email: string;
    photo: string | null;
    idArea: number | null;
    areaName: string | null;
    total: number;
    completadas: number;
    aplazadas: number;
    canceladas: number;
    todayTotal: number;
    todayCompleted: number;
    lastActivity: string | null;
    complianceRate: number;
}

function toInt(value: string | number | null | undefined): number {
    const parsed = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function toFloat(value: string | number | null | undefined): number {
    const parsed = typeof value === "number" ? value : parseFloat(String(value ?? ""));
    return Number.isNaN(parsed) ? 0 : parsed;
}

function toIso(value: Date | string | null | undefined): string {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export class PausaRepository {
    private repo: Repository<Pausa>;

    constructor() {
        this.repo = AppDataSource.getRepository(Pausa);
    }

    private toRecord(pausa: Pausa): PausaRecord {
        return {
            id: pausa.id_pausa,
            idUser: pausa.id_user,
            userName: pausa.user?.name_user ?? null,
            idRoutine: pausa.id_routine,
            routineName: pausa.routine?.name_routine ?? null,
            idArea: pausa.id_area,
            areaName: pausa.area?.name_area ?? null,
            scheduledAt: toIso(pausa.scheduled_at),
            completedAt: pausa.completed_at ? toIso(pausa.completed_at) : null,
            status: pausa.status_pausa,
        };
    }

    private applyRange(qb: SelectQueryBuilder<Pausa>, filters: AnalyticsFilters | UserHistoryFilters): void {
        if ("areaId" in filters && filters.areaId !== undefined) {
            qb.andWhere("p.id_area = :areaId", { areaId: filters.areaId });
        }
        if (filters.start) {
            qb.andWhere("p.scheduled_at >= :start", { start: filters.start });
        }
        if (filters.end) {
            qb.andWhere("p.scheduled_at <= :end", { end: filters.end });
        }
    }

    async create(input: PausaCreateInput): Promise<number> {
        const entity = this.repo.create({
            id_user: input.userId,
            id_routine: input.routineId,
            id_area: input.areaId,
            scheduled_at: input.scheduledAt,
            completed_at: input.completedAt ?? null,
            status_pausa: input.status,
        });
        const saved = await this.repo.save(entity);
        return saved.id_pausa;
    }

    async findById(id: number): Promise<PausaRecord | null> {
        const pausa = await this.repo.findOne({
            where: { id_pausa: id },
            relations: { user: true, routine: true, area: true },
        });
        return pausa ? this.toRecord(pausa) : null;
    }

    async findByUser(userId: number, filters: UserHistoryFilters = {}): Promise<PausaRecord[]> {
        const qb = this.repo
            .createQueryBuilder("p")
            .leftJoinAndSelect("p.user", "ptUser")
            .leftJoinAndSelect("p.routine", "ptRoutine")
            .leftJoinAndSelect("p.area", "ptArea")
            .where("p.id_user = :userId", { userId });

        if (filters.status !== undefined) {
            qb.andWhere("p.status_pausa = :status", { status: filters.status });
        }
        this.applyRange(qb, filters);
        qb.orderBy("p.scheduled_at", "DESC");

        const offset = filters.offset ?? 0;
        const limit = filters.limit ?? 50;
        if (limit > 0) {
            qb.skip(offset).take(limit);
        }

        const rows = await qb.getMany();
        return rows.map((r) => this.toRecord(r));
    }

    async countByUser(userId: number, filters: UserHistoryFilters = {}): Promise<number> {
        const qb = this.repo
            .createQueryBuilder("p")
            .where("p.id_user = :userId", { userId });
        if (filters.status !== undefined) {
            qb.andWhere("p.status_pausa = :status", { status: filters.status });
        }
        this.applyRange(qb, filters);
        return qb.getCount();
    }

    async updateStatus(id: number, input: PausaUpdateInput): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_pausa: id } });
        if (!existing) return false;

        if (input.status !== undefined) {
            existing.status_pausa = input.status;
        }
        if (input.completedAt !== undefined) {
            existing.completed_at = input.completedAt;
        }
        await this.repo.save(existing);
        return true;
    }

    async analyticsSummary(filters: AnalyticsFilters = {}): Promise<AnalyticsSummary> {
        const qb = this.repo
            .createQueryBuilder("p")
            .select("COUNT(*)::int", "total")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :programada)::int`, "programadas")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :completada)::int`, "completadas")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :aplazada)::int`, "aplazadas")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :cancelada)::int`, "canceladas")
            .addSelect(`COUNT(DISTINCT p.id_user)::int`, "colaboradores")
            .setParameter("programada", PAUSA_STATUS.PROGRAMADA)
            .setParameter("completada", PAUSA_STATUS.COMPLETADA)
            .setParameter("aplazada", PAUSA_STATUS.APLAZADA)
            .setParameter("cancelada", PAUSA_STATUS.CANCELADA);

        this.applyRange(qb, filters);
        const row = await qb.getRawOne();

        return {
            total: toInt(row?.total),
            programadas: toInt(row?.programadas),
            completadas: toInt(row?.completadas),
            aplazadas: toInt(row?.aplazadas),
            canceladas: toInt(row?.canceladas),
            colaboradores: toInt(row?.colaboradores),
            activeWorkers: await this.countActiveWorkers(filters.areaId),
            activeAreas: await this.countActiveAreas(),
        };
    }

    async analyticsTimeline(filters: AnalyticsFilters = {}, granularity: "day" | "month"): Promise<TimelinePoint[]> {
        const trunc = granularity === "month" ? "month" : "day";
        const fmt = granularity === "month" ? "YYYY-MM" : "YYYY-MM-DD";
        const tz = envs.APP_TIMEZONE;
        const periodExpr = `to_char(date_trunc('${trunc}', p.scheduled_at AT TIME ZONE '${tz}'), '${fmt}')`;

        const qb = this.repo
            .createQueryBuilder("p")
            .select(periodExpr, "period")
            .addSelect("COUNT(*)::int", "total")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :programada)::int`, "programadas")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :completada)::int`, "completadas")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :aplazada)::int`, "aplazadas")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :cancelada)::int`, "canceladas")
            .setParameter("programada", PAUSA_STATUS.PROGRAMADA)
            .setParameter("completada", PAUSA_STATUS.COMPLETADA)
            .setParameter("aplazada", PAUSA_STATUS.APLAZADA)
            .setParameter("cancelada", PAUSA_STATUS.CANCELADA)
            .groupBy(periodExpr)
            .orderBy(periodExpr, "ASC");

        this.applyRange(qb, filters);
        const rows = await qb.getRawMany();

        return rows.map((r) => ({
            period: String(r.period ?? ""),
            total: toInt(r.total),
            programadas: toInt(r.programadas),
            completadas: toInt(r.completadas),
            aplazadas: toInt(r.aplazadas),
            canceladas: toInt(r.canceladas),
        }));
    }

    async analyticsByArea(filters: AnalyticsFilters = {}): Promise<AreaComplianceRow[]> {
        const qb = this.repo
            .createQueryBuilder("p")
            .leftJoin("p.area", "area")
            .select(`COALESCE(p.id_area, 0)::int`, "idArea")
            .addSelect(`COALESCE(area.name_area, 'Sin área')`, "areaName")
            .addSelect("COUNT(*)::int", "total")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :completada)::int`, "completadas")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :cancelada)::int`, "canceladas")
            .addSelect(`COUNT(DISTINCT p.id_user)::int`, "colaboradores")
            .addSelect(
                `ROUND(100.0 * COUNT(*) FILTER (WHERE p.status_pausa = :completada) / NULLIF(COUNT(*), 0), 1)`,
                "complianceRate"
            )
            .setParameter("completada", PAUSA_STATUS.COMPLETADA)
            .setParameter("cancelada", PAUSA_STATUS.CANCELADA)
            .groupBy("p.id_area")
            .addGroupBy("area.name_area")
            .orderBy(`COALESCE(area.name_area, 'Sin área')`, "ASC");

        this.applyRange(qb, filters);
        const rows = await qb.getRawMany();

        return rows.map((r) => ({
            idArea: toInt(r.idArea) === 0 ? null : toInt(r.idArea),
            areaName: String(r.areaName ?? "Sin área"),
            total: toInt(r.total),
            completadas: toInt(r.completadas),
            canceladas: toInt(r.canceladas),
            colaboradores: toInt(r.colaboradores),
            complianceRate: toFloat(r.complianceRate),
            workers: 0,
        }));
    }

    async analyticsByUser(filters: AnalyticsFilters = {}): Promise<UserComplianceRow[]> {
        const roleRepo = AppDataSource.getRepository(Role);
        const adminRole = await roleRepo.findOne({ where: { name_role: ADMIN_ROLE_NAME } });
        const adminRoleId = adminRole?.id_role ?? -1;

        const tz = envs.APP_TIMEZONE;
        const todayStart = zonedDateTime(formatDateInTz(new Date(), tz), "00:00", tz);
        const todayEnd = new Date(todayStart.getTime() + 86400000);

        const joinConditions = ["p.id_user = u.id_user"];
        if (filters.start) joinConditions.push("p.scheduled_at >= :start");
        if (filters.end) joinConditions.push("p.scheduled_at <= :end");

        const qb = AppDataSource.getRepository(User)
            .createQueryBuilder("u")
            .leftJoin("u.area", "area")
            .leftJoin(Pausa, "p", joinConditions.join(" AND "))
            .select("u.id_user", "idUser")
            .addSelect("u.name_user", "name")
            .addSelect("u.email_user", "email")
            .addSelect("u.photo_user", "photo")
            .addSelect("u.id_area", "idArea")
            .addSelect("area.name_area", "areaName")
            .addSelect("COUNT(p.id_pausa)::int", "total")
            .addSelect(`COUNT(p.id_pausa) FILTER (WHERE p.status_pausa = :completada)::int`, "completadas")
            .addSelect(`COUNT(p.id_pausa) FILTER (WHERE p.status_pausa = :aplazada)::int`, "aplazadas")
            .addSelect(`COUNT(p.id_pausa) FILTER (WHERE p.status_pausa = :cancelada)::int`, "canceladas")
            .addSelect(
                `COUNT(p.id_pausa) FILTER (WHERE p.scheduled_at >= :todayStart AND p.scheduled_at < :todayEnd)::int`,
                "todayTotal"
            )
            .addSelect(
                `COUNT(p.id_pausa) FILTER (WHERE p.status_pausa = :completada AND p.scheduled_at >= :todayStart AND p.scheduled_at < :todayEnd)::int`,
                "todayCompleted"
            )
            .addSelect("MAX(p.scheduled_at)", "lastActivity")
            .where("u.status_user = 1")
            .andWhere("(u.id_role IS NULL OR u.id_role != :adminRoleId)", { adminRoleId })
            .setParameters({
                completada: PAUSA_STATUS.COMPLETADA,
                aplazada: PAUSA_STATUS.APLAZADA,
                cancelada: PAUSA_STATUS.CANCELADA,
                todayStart,
                todayEnd,
            })
            .groupBy("u.id_user")
            .addGroupBy("area.name_area")
            .orderBy("u.name_user", "ASC");

        if (filters.areaId !== undefined) {
            qb.andWhere("u.id_area = :areaId", { areaId: filters.areaId });
        }
        if (filters.start) qb.setParameter("start", filters.start);
        if (filters.end) qb.setParameter("end", filters.end);

        const rows = await qb.getRawMany();
        return rows.map((r) => {
            const total = toInt(r.total);
            const completadas = toInt(r.completadas);
            return {
                idUser: toInt(r.idUser),
                name: String(r.name ?? ""),
                email: String(r.email ?? ""),
                photo: r.photo ?? null,
                idArea: r.idArea == null ? null : toInt(r.idArea),
                areaName: r.areaName ?? null,
                total,
                completadas,
                aplazadas: toInt(r.aplazadas),
                canceladas: toInt(r.canceladas),
                todayTotal: toInt(r.todayTotal),
                todayCompleted: toInt(r.todayCompleted),
                lastActivity: r.lastActivity ? toIso(r.lastActivity) : null,
                complianceRate: total > 0 ? Math.round((1000 * completadas) / total) / 10 : 0,
            };
        });
    }

    async userStats(userId: number): Promise<{ programadas: number; completadas: number; aplazadas: number; canceladas: number }> {
        const row = await this.repo
            .createQueryBuilder("p")
            .select(`COUNT(*) FILTER (WHERE p.status_pausa = :programada)::int`, "programadas")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :completada)::int`, "completadas")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :aplazada)::int`, "aplazadas")
            .addSelect(`COUNT(*) FILTER (WHERE p.status_pausa = :cancelada)::int`, "canceladas")
            .setParameter("programada", PAUSA_STATUS.PROGRAMADA)
            .setParameter("completada", PAUSA_STATUS.COMPLETADA)
            .setParameter("aplazada", PAUSA_STATUS.APLAZADA)
            .setParameter("cancelada", PAUSA_STATUS.CANCELADA)
            .where("p.id_user = :userId", { userId })
            .getRawOne();

        return {
            programadas: toInt(row?.programadas),
            completadas: toInt(row?.completadas),
            aplazadas: toInt(row?.aplazadas),
            canceladas: toInt(row?.canceladas),
        };
    }

    async completionDays(userId: number): Promise<string[]> {
        const tz = envs.APP_TIMEZONE;
        const dayExpr = `(p.scheduled_at AT TIME ZONE '${tz}')::date`;
        const rows = await this.repo
            .createQueryBuilder("p")
            .select(`DISTINCT ${dayExpr}`, "day")
            .where("p.id_user = :userId", { userId })
            .andWhere("p.status_pausa = :completada", { completada: PAUSA_STATUS.COMPLETADA })
            .orderBy(dayExpr, "DESC")
            .getRawMany();

        return rows.map((r) => String(r.day ?? ""));
    }

    async firstActivity(userId: number): Promise<string | null> {
        const row = await this.repo
            .createQueryBuilder("p")
            .select("MIN(p.scheduled_at)", "first")
            .where("p.id_user = :userId", { userId })
            .getRawOne();
        const first = row?.first;
        return first ? toIso(first) : null;
    }

    async completedInLastDays(userId: number, days: number): Promise<number> {
        const from = new Date(Date.now() - days * 86400000);
        const row = await this.repo
            .createQueryBuilder("p")
            .select("COUNT(*)::int", "count")
            .where("p.id_user = :userId", { userId })
            .andWhere("p.status_pausa = :completada", { completada: PAUSA_STATUS.COMPLETADA })
            .andWhere("p.scheduled_at >= :from", { from })
            .getRawOne();
        return toInt(row?.count);
    }

    async countActiveWorkers(areaId?: number): Promise<number> {
        const roleRepo = AppDataSource.getRepository(Role);
        const adminRole = await roleRepo.findOne({ where: { name_role: ADMIN_ROLE_NAME } });
        const adminRoleId = adminRole?.id_role ?? -1;

        const qb = AppDataSource.getRepository(User)
            .createQueryBuilder("u")
            .select("COUNT(*)::int", "count")
            .where("u.status_user = 1")
            .andWhere("u.id_role != :adminRoleId", { adminRoleId });
        if (areaId !== undefined) {
            qb.andWhere("u.id_area = :areaId", { areaId });
        }
        const row = await qb.getRawOne();
        return toInt(row?.count);
    }

    async countActiveAreas(): Promise<number> {
        const row = await AppDataSource.getRepository(Area)
            .createQueryBuilder("a")
            .select("COUNT(*)::int", "count")
            .where("a.status_area = 1")
            .getRawOne();
        return toInt(row?.count);
    }

    async countActiveWorkersByArea(): Promise<{ idArea: number | null; count: number }[]> {
        const roleRepo = AppDataSource.getRepository(Role);
        const adminRole = await roleRepo.findOne({ where: { name_role: ADMIN_ROLE_NAME } });
        const adminRoleId = adminRole?.id_role ?? -1;

        const rows = await AppDataSource.getRepository(User)
            .createQueryBuilder("u")
            .select("COALESCE(u.id_area, 0)::int", "idArea")
            .addSelect("COUNT(*)::int", "count")
            .where("u.status_user = 1")
            .andWhere("u.id_role != :adminRoleId", { adminRoleId })
            .groupBy("u.id_area")
            .getRawMany();

        return rows.map((r) => ({
            idArea: toInt(r.idArea) === 0 ? null : toInt(r.idArea),
            count: toInt(r.count),
        }));
    }
}