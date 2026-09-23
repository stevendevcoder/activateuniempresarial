import envs from "../../../config/environment-vars";
import { formatDateInTz, formatTimeInTz, isWithinRange, minutesFromTime } from "../../../utils/timezone";
import {
    GlobalConfigInput,
    GlobalConfigRecord,
    HolidayInput,
    HolidayRecord,
    IConfigRepository,
} from "../repository/config.repository";

export class ConfigService {
    private configRepo: IConfigRepository;

    constructor(configRepo: IConfigRepository) {
        this.configRepo = configRepo;
    }

    async getConfig(): Promise<GlobalConfigRecord> {
        return this.configRepo.getConfig();
    }

    async updateConfig(input: GlobalConfigInput): Promise<GlobalConfigRecord> {
        const current = await this.configRepo.getConfig();
        const lunchStart = input.lunchStart ?? current.lunchStart;
        const lunchEnd = input.lunchEnd ?? current.lunchEnd;

        if (minutesFromTime(lunchStart) >= minutesFromTime(lunchEnd)) {
            throw new Error("El fin del almuerzo debe ser posterior al inicio");
        }

        return this.configRepo.updateConfig(input);
    }

    async listHolidays(): Promise<HolidayRecord[]> {
        return this.configRepo.listHolidays();
    }

    async createHoliday(input: HolidayInput): Promise<number> {
        const existing = await this.configRepo.findHolidayByDate(input.date);
        if (existing) {
            throw new Error("Ya existe un festivo registrado en esa fecha");
        }
        return this.configRepo.createHoliday(input);
    }

    async deleteHoliday(id: number): Promise<boolean> {
        const existing = await this.configRepo.findHolidayById(id);
        if (!existing) {
            throw new Error("Festivo no encontrado");
        }
        return this.configRepo.deleteHoliday(id);
    }

    async isLunchTime(date: Date): Promise<boolean> {
        const config = await this.configRepo.getConfig();
        const time = formatTimeInTz(date, envs.APP_TIMEZONE);
        return isWithinRange(time, config.lunchStart, config.lunchEnd);
    }

    async isHoliday(date: Date): Promise<boolean> {
        const day = formatDateInTz(date, envs.APP_TIMEZONE);
        const holidays = await this.configRepo.listHolidays();
        const monthDay = day.slice(5);
        return holidays.some(
            (h) => h.date === day || (h.recurring && h.date.slice(5) === monthDay)
        );
    }
}
