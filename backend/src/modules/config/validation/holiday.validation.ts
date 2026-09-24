import joi from "joi";
import { HolidayInput } from "../repository/config.repository";

export type ReturnHolidayData = HolidayInput;

function validateHolidayData(data: any) {
    const schema = joi
        .object({
            date: joi
                .string()
                .trim()
                .pattern(/^\d{4}-\d{2}-\d{2}$/)
                .required()
                .messages({
                    "string.empty": "La fecha es requerida",
                    "string.pattern.base": "La fecha debe tener formato YYYY-MM-DD",
                    "any.required": "La fecha es requerida",
                }),
            name: joi.string().trim().min(3).max(150).required().messages({
                "string.empty": "El nombre del festivo es requerido",
                "string.min": "El nombre debe tener al menos 3 caracteres",
                "any.required": "El nombre del festivo es requerido",
            }),
            recurring: joi.boolean().default(false).messages({
                "boolean.base": "El campo recurrente debe ser booleano",
            }),
        })
        .unknown(false);

    return schema.validate(data, { abortEarly: false });
}

export const loadHolidayData = (data: any): ReturnHolidayData => {
    const { error, value } = validateHolidayData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};
