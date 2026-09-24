import joi from "joi";
import { PAUSA_STATUS, PausaStatus } from "../../pausas/repository/pausa.repository";

export const STATUS_STRINGS = {
    programada: PAUSA_STATUS.PROGRAMADA,
    completada: PAUSA_STATUS.COMPLETADA,
    aplazada: PAUSA_STATUS.APLAZADA,
    cancelada: PAUSA_STATUS.CANCELADA,
} as const;

export type StatusString = keyof typeof STATUS_STRINGS;

export function parseStatusString(status: StatusString): PausaStatus {
    return STATUS_STRINGS[status];
}

export interface RegisterPauseData {
    routineId: number | null;
    scheduledAt?: string;
    status?: PausaStatus;
}

export function loadRegisterPauseData(data: unknown): RegisterPauseData {
    const schema = joi
        .object({
            routineId: joi.number().integer().positive().allow(null).optional(),
            scheduledAt: joi.string().optional(),
            status: joi.string().valid("programada", "completada", "aplazada", "cancelada").optional(),
        })
        .unknown(false);

    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }

    const result: RegisterPauseData = { routineId: value.routineId ?? null };

    if (value.scheduledAt !== undefined) {
        const date = new Date(value.scheduledAt);
        if (Number.isNaN(date.getTime())) {
            throw new Error("scheduledAt no es una fecha válida");
        }
        result.scheduledAt = date.toISOString();
    }

    if (value.status !== undefined) {
        result.status = STATUS_STRINGS[value.status as StatusString];
    }

    return result;
}

export interface StatusTransitionInput {
    status: PausaStatus;
}

export function loadStatusTransitionData(data: unknown): StatusTransitionInput {
    const schema = joi
        .object({
            status: joi.string().valid("programada", "completada", "aplazada", "cancelada").required(),
        })
        .unknown(false);

    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }

    return { status: STATUS_STRINGS[value.status as StatusString] };
}

export interface ProfileUpdateInput {
    name?: string;
    password?: string;
    currentPassword?: string;
}

export function loadProfileUpdateData(data: unknown): ProfileUpdateInput {
    const schema = joi
        .object({
            name: joi.string().min(2).max(255).optional(),
            password: joi.string().min(6).max(255).optional(),
            currentPassword: joi.string().optional(),
        })
        .unknown(false);

    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value as ProfileUpdateInput;
}

export interface HistoryPagination {
    status?: number;
    limit: number;
    offset: number;
    start?: string;
    end?: string;
}

export function loadHistoryQuery(query: unknown): HistoryPagination {
    const source = (query ?? {}) as Record<string, unknown>;

    const status = source.status !== undefined ? Number(source.status) : undefined;
    if (status !== undefined && (Number.isNaN(status) || ![1, 2, 3, 4].includes(status))) {
        throw new Error("status debe ser 1 (programada), 2 (completada), 3 (aplazada) o 4 (cancelada)");
    }

    const limit = source.limit !== undefined ? Number(source.limit) : 50;
    const offset = source.offset !== undefined ? Number(source.offset) : 0;
    if (Number.isNaN(limit) || limit < 1 || limit > 200) {
        throw new Error("limit debe estar entre 1 y 200");
    }
    if (Number.isNaN(offset) || offset < 0) {
        throw new Error("offset debe ser un número no negativo");
    }

    const parseDate = (value: unknown): string | undefined => {
        if (value === undefined || value === null || value === "") return undefined;
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime())) {
            throw new Error("start o end no son fechas válidas");
        }
        return date.toISOString();
    };

    const result: HistoryPagination = { limit, offset };
    const start = parseDate(source.start);
    const end = parseDate(source.end);

    if (status !== undefined) result.status = status;
    if (start !== undefined) result.start = start;
    if (end !== undefined) result.end = end;

    return result;
}