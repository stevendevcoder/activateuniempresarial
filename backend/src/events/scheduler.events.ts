import { EventEmitter } from "events";

export interface PausaDueEvent {
    idEvent: number;
    idSchedule: number;
    idArea: number;
    areaName: string | null;
    idRoutine: number | null;
    scheduledAt: string;
}

export const PAUSA_DUE = "pausa.due";

export const schedulerEvents = new EventEmitter();

schedulerEvents.setMaxListeners(50);
