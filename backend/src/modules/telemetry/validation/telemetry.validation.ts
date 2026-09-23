import joi from "joi";
import { TELEMETRY_EVENT, TelemetryEventType } from "../repository/telemetry.repository";

export interface TelemetryEventData {
    idPausa: number | null;
    idScheduleEvent: number | null;
    idArea: number | null;
    type: TelemetryEventType;
    reason: string | null;
    occurredAt: Date;
}

const eventSchema = joi
    .object({
        type: joi
            .number()
            .valid(
                TELEMETRY_EVENT.INICIO,
                TELEMETRY_EVENT.FIN,
                TELEMETRY_EVENT.APLAZAMIENTO,
                TELEMETRY_EVENT.CANCELACION
            )
            .required()
            .messages({
                "any.required": "El tipo de evento es obligatorio",
                "any.only": "El tipo de evento debe ser 1 (inicio), 2 (fin), 3 (aplazamiento) o 4 (cancelación)",
            }),
        idPausa: joi.number().integer().positive().allow(null).default(null),
        idScheduleEvent: joi.number().integer().positive().allow(null).default(null),
        idArea: joi.number().integer().positive().allow(null).default(null),
        reason: joi
            .string()
            .trim()
            .max(255)
            .allow("", null)
            .default(null)
            .when("type", {
                is: TELEMETRY_EVENT.CANCELACION,
                then: joi.string().trim().min(3).max(255).required().messages({
                    "string.empty": "La cancelación requiere un motivo",
                    "string.min": "El motivo de cancelación debe tener al menos 3 caracteres",
                    "any.required": "La cancelación requiere un motivo",
                }),
            }),
        occurredAt: joi.string().isoDate().optional().messages({
            "string.isoDate": "La marca de tiempo debe estar en formato ISO 8601",
        }),
    })
    .unknown(false);

function toEventData(value: any): TelemetryEventData {
    return {
        idPausa: value.idPausa,
        idScheduleEvent: value.idScheduleEvent,
        idArea: value.idArea,
        type: value.type,
        reason: value.reason ?? null,
        occurredAt: value.occurredAt ? new Date(value.occurredAt) : new Date(),
    };
}

export const loadTelemetryEvent = (data: any): TelemetryEventData => {
    const { error, value } = eventSchema.validate(data, { abortEarly: false });
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return toEventData(value);
};

export const loadTelemetryBatch = (data: any): TelemetryEventData[] => {
    const schema = joi.array().items(eventSchema).min(1).max(100).required();
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return (value as any[]).map(toEventData);
};
