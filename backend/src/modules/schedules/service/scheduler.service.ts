import envs from "../../../config/environment-vars";
import {
    formatDateInTz,
    formatTimeInTz,
    isWithinRange,
    minutesFromTime,
    minutesToTime,
    weekdayInTz,
    zonedDateTime,
} from "../../../utils/timezone";
import { PAUSA_DUE, PausaDueEvent, schedulerEvents } from "../../../events/scheduler.events";
import { ConfigService } from "../../config/service/config.service";
import { IScheduleRepository, ScheduleRecord } from "../repository/schedule.repository";

export class SchedulerService {
    private scheduleRepo: IScheduleRepository;
    private configService: ConfigService;
    private timer: NodeJS.Timeout | null = null;

    constructor(scheduleRepo: IScheduleRepository, configService: ConfigService) {
        this.scheduleRepo = scheduleRepo;
        this.configService = configService;
    }

    private computeSlots(schedule: ScheduleRecord): string[] {
        const slots: string[] = [];
        const start = minutesFromTime(schedule.startTime);
        const end = minutesFromTime(schedule.endTime);
        for (let m = start; m < end; m += schedule.frequencyMinutes) {
            slots.push(minutesToTime(m));
        }
        return slots;
    }

    async runOnce(now: Date = new Date()): Promise<number> {
        const tz = envs.APP_TIMEZONE;
        const today = formatDateInTz(now, tz);
        const weekday = weekdayInTz(now, tz);

        if (await this.configService.isHoliday(now)) {
            return 0;
        }

        const config = await this.configService.getConfig();
        const nowMinutes = minutesFromTime(formatTimeInTz(now, tz));
        const schedules = await this.scheduleRepo.listRunnable();

        let emitted = 0;
        for (const schedule of schedules) {
            if (!schedule.daysOfWeek.includes(weekday)) continue;

            for (const slot of this.computeSlots(schedule)) {
                const slotMinutes = minutesFromTime(slot);
                if (nowMinutes < slotMinutes || nowMinutes >= slotMinutes + schedule.frequencyMinutes) {
                    continue;
                }
                if (isWithinRange(slot, config.lunchStart, config.lunchEnd)) {
                    continue;
                }

                const scheduledAt = zonedDateTime(today, slot, tz);
                const idEvent = await this.scheduleRepo.createEvent({
                    idSchedule: schedule.id,
                    idArea: schedule.idArea,
                    idRoutine: schedule.idRoutine,
                    scheduledAt,
                    slotKey: `${schedule.id}:${today}:${slot}`,
                });

                if (idEvent !== null) {
                    emitted++;
                    const payload: PausaDueEvent = {
                        idEvent,
                        idSchedule: schedule.id,
                        idArea: schedule.idArea,
                        areaName: schedule.areaName,
                        idRoutine: schedule.idRoutine,
                        scheduledAt: scheduledAt.toISOString(),
                    };
                    schedulerEvents.emit(PAUSA_DUE, payload);
                }
            }
        }

        return emitted;
    }

    start(intervalMs = 60000): void {
        if (this.timer) return;
        this.timer = setInterval(() => {
            this.runOnce().catch((error) => {
                console.error("[scheduler] error al ejecutar el ciclo:", error);
            });
        }, intervalMs);
        this.timer.unref();
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
