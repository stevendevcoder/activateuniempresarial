import joi from "joi";
import { ScheduleInput } from "../repository/schedule.repository";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const baseSchema = {
    idArea: joi.number().integer().positive().messages({
        "number.base": "El área debe ser un ID numérico",
        "number.positive": "El área debe ser un ID positivo",
    }),
    idRoutine: joi.number().integer().positive().allow(null).messages({
        "number.base": "La rutina debe ser un ID numérico",
        "number.positive": "La rutina debe ser un ID positivo",
    }),
    startTime: joi.string().trim().pattern(TIME_PATTERN).messages({
        "string.pattern.base": "La hora de inicio debe tener formato HH:mm",
    }),
    endTime: joi.string().trim().pattern(TIME_PATTERN).messages({
        "string.pattern.base": "La hora de fin debe tener formato HH:mm",
    }),
    frequencyMinutes: joi.number().integer().min(5).max(720).messages({
        "number.base": "La frecuencia debe ser numérica",
        "number.min": "La frecuencia mínima es de 5 minutos",
        "number.max": "La frecuencia máxima es de 720 minutos",
    }),
    durationMinutes: joi.number().integer().min(1).max(120).messages({
        "number.base": "La duración debe ser numérica",
        "number.min": "La duración mínima es de 1 minuto",
        "number.max": "La duración máxima es de 120 minutos",
    }),
    daysOfWeek: joi
        .array()
        .items(joi.number().integer().min(0).max(6))
        .min(1)
        .messages({
            "array.base": "Los días de la semana deben ser una lista",
            "array.min": "Debe seleccionar al menos un día",
            "number.min": "Los días van de 0 (domingo) a 6 (sábado)",
            "number.max": "Los días van de 0 (domingo) a 6 (sábado)",
        }),
    status: joi.number().valid(0, 1).messages({
        "any.only": "El estado debe ser 0 o 1",
    }),
};

function validateCreate(data: any) {
    const schema = joi
        .object({
            ...baseSchema,
            idArea: baseSchema.idArea.required().messages({
                "any.required": "El área es obligatoria",
            }),
            startTime: baseSchema.startTime.required().messages({
                "any.required": "La hora de inicio es obligatoria",
            }),
            endTime: baseSchema.endTime.required().messages({
                "any.required": "La hora de fin es obligatoria",
            }),
            frequencyMinutes: baseSchema.frequencyMinutes.default(120),
            durationMinutes: baseSchema.durationMinutes.default(5),
            daysOfWeek: baseSchema.daysOfWeek.default([1, 2, 3, 4, 5]),
            idRoutine: baseSchema.idRoutine.default(null),
            status: baseSchema.status.default(1),
        })
        .unknown(false);
    return schema.validate(data, { abortEarly: false });
}

function validateUpdate(data: any) {
    const schema = joi.object(baseSchema).min(1).unknown(false);
    return schema.validate(data, { abortEarly: false });
}

export const loadScheduleData = (data: any): ScheduleInput => {
    const { error, value } = validateCreate(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};

export const loadScheduleUpdateData = (data: any): Partial<ScheduleInput> => {
    const { error, value } = validateUpdate(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};
