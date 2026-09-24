import joi from "joi";
import { GlobalConfigInput } from "../repository/config.repository";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function validateConfigData(data: any) {
    const schema = joi
        .object({
            lunchStart: joi.string().trim().pattern(TIME_PATTERN).messages({
                "string.pattern.base": "El inicio de almuerzo debe tener formato HH:mm",
            }),
            lunchEnd: joi.string().trim().pattern(TIME_PATTERN).messages({
                "string.pattern.base": "El fin de almuerzo debe tener formato HH:mm",
            }),
            maxPostponements: joi.number().integer().min(0).max(10).messages({
                "number.base": "El máximo de aplazamientos debe ser numérico",
                "number.min": "El máximo de aplazamientos no puede ser negativo",
                "number.max": "El máximo de aplazamientos no puede superar 10",
            }),
            dashboardMode: joi.string().valid("realtime", "batch").messages({
                "any.only": "El modo del dashboard debe ser realtime o batch",
            }),
            retentionMonths: joi.number().integer().min(1).max(120).messages({
                "number.base": "La retención debe ser numérica",
                "number.min": "La retención mínima es de 1 mes",
                "number.max": "La retención máxima es de 120 meses",
            }),
        })
        .min(1)
        .unknown(false);

    return schema.validate(data, { abortEarly: false });
}

export const loadConfigUpdateData = (data: any): GlobalConfigInput => {
    const { error, value } = validateConfigData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};
