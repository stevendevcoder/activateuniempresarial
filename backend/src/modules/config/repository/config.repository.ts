import { Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { GlobalConfig } from "./global-config.entity";
import { Holiday } from "./holiday.entity";

export type DashboardMode = "realtime" | "batch";

export interface GlobalConfigRecord {
    lunchStart: string;
    lunchEnd: string;
    maxPostponements: number;
    dashboardMode: DashboardMode;
    retentionMonths: number;
    updatedAt: string;
}

export interface GlobalConfigInput {
    lunchStart?: string;
    lunchEnd?: string;
    maxPostponements?: number;
    dashboardMode?: DashboardMode;
    retentionMonths?: number;
}

export interface HolidayRecord {
    id: number;
    date: string;
    name: string;
    recurring: boolean;
    status: number;
}

export interface HolidayInput {
    date: string;
    name: string;
    recurring: boolean;
}

const CONFIG_ID = 1;

function toIso(value: Date | string | null | undefined): string {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function toDateOnly(value: string | Date): string {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    return String(value).slice(0, 10);
}

export interface IConfigRepository {
    getConfig(): Promise<GlobalConfigRecord>;
    updateConfig(input: GlobalConfigInput): Promise<GlobalConfigRecord>;
    listHolidays(): Promise<HolidayRecord[]>;
    findHolidayById(id: number): Promise<HolidayRecord | null>;
    findHolidayByDate(date: string): Promise<HolidayRecord | null>;
    findHolidaysInRange(start: string, end: string): Promise<HolidayRecord[]>;
    createHoliday(input: HolidayInput): Promise<number>;
    deleteHoliday(id: number): Promise<boolean>;
}

export class ConfigRepository implements IConfigRepository {
    private configRepo: Repository<GlobalConfig>;
    private holidayRepo: Repository<Holiday>;

    constructor() {
        this.configRepo = AppDataSource.getRepository(GlobalConfig);
        this.holidayRepo = AppDataSource.getRepository(Holiday);
    }

    private toConfigRecord(config: GlobalConfig): GlobalConfigRecord {
        return {
            lunchStart: config.lunch_start,
            lunchEnd: config.lunch_end,
            maxPostponements: config.max_postponements,
            dashboardMode: config.dashboard_mode === "batch" ? "batch" : "realtime",
            retentionMonths: config.retention_months,
            updatedAt: toIso(config.updated_at),
        };
    }

    private toHolidayRecord(holiday: Holiday): HolidayRecord {
        return {
            id: holiday.id_holiday,
            date: toDateOnly(holiday.holiday_date),
            name: holiday.name_holiday,
            recurring: holiday.recurring_holiday,
            status: holiday.status_holiday,
        };
    }

    private async ensureConfig(): Promise<GlobalConfig> {
        let config = await this.configRepo.findOne({ where: { id_config: CONFIG_ID } });
        if (!config) {
            config = this.configRepo.create({
                id_config: CONFIG_ID,
                lunch_start: "12:00",
                lunch_end: "14:00",
                max_postponements: 2,
                dashboard_mode: "realtime",
                retention_months: 24,
            });
            config = await this.configRepo.save(config);
        }
        return config;
    }

    async getConfig(): Promise<GlobalConfigRecord> {
        const config = await this.ensureConfig();
        return this.toConfigRecord(config);
    }

    async updateConfig(input: GlobalConfigInput): Promise<GlobalConfigRecord> {
        const config = await this.ensureConfig();

        if (input.lunchStart !== undefined) config.lunch_start = input.lunchStart;
        if (input.lunchEnd !== undefined) config.lunch_end = input.lunchEnd;
        if (input.maxPostponements !== undefined) config.max_postponements = input.maxPostponements;
        if (input.dashboardMode !== undefined) config.dashboard_mode = input.dashboardMode;
        if (input.retentionMonths !== undefined) config.retention_months = input.retentionMonths;

        const saved = await this.configRepo.save(config);
        return this.toConfigRecord(saved);
    }

    async listHolidays(): Promise<HolidayRecord[]> {
        const holidays = await this.holidayRepo.find({
            where: { status_holiday: 1 },
            order: { holiday_date: "ASC" },
        });
        return holidays.map((h) => this.toHolidayRecord(h));
    }

    async findHolidayById(id: number): Promise<HolidayRecord | null> {
        const holiday = await this.holidayRepo.findOne({ where: { id_holiday: id } });
        return holiday ? this.toHolidayRecord(holiday) : null;
    }

    async findHolidayByDate(date: string): Promise<HolidayRecord | null> {
        const holiday = await this.holidayRepo.findOne({
            where: { holiday_date: date, status_holiday: 1 },
        });
        return holiday ? this.toHolidayRecord(holiday) : null;
    }

    async findHolidaysInRange(start: string, end: string): Promise<HolidayRecord[]> {
        const holidays = await this.holidayRepo
            .createQueryBuilder("h")
            .where("h.status_holiday = 1")
            .andWhere("h.holiday_date BETWEEN :start AND :end", { start, end })
            .getMany();
        return holidays.map((h) => this.toHolidayRecord(h));
    }

    async createHoliday(input: HolidayInput): Promise<number> {
        const entity = this.holidayRepo.create({
            holiday_date: input.date,
            name_holiday: input.name,
            recurring_holiday: input.recurring,
            status_holiday: 1,
        });
        const saved = await this.holidayRepo.save(entity);
        return saved.id_holiday;
    }

    async deleteHoliday(id: number): Promise<boolean> {
        const existing = await this.holidayRepo.findOne({ where: { id_holiday: id } });
        if (!existing) return false;
        existing.status_holiday = 0;
        await this.holidayRepo.save(existing);
        return true;
    }
}
