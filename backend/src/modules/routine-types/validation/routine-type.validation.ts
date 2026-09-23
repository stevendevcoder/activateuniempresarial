import joi from "joi";

export type ReturnRoutineTypeData = {
    name: string;
    description: string;
    icon: string;
    color: string;
    status: number;
};

const colorPattern = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const iconPattern = /^[a-zA-Z0-9_-]{1,50}$/;

function validateRoutineTypeData(data: any) {
    const schema = joi.object({
        name: joi.string().trim().min(3).max(100).required().messages({
            "string.base": "El nombre debe ser un texto",
            "string.empty": "El nombre es requerido",
            "string.min": "El nombre debe tener al menos 3 caracteres",
        }),
        description: joi.string().trim().max(255).allow("").default("").messages({
            "string.base": "La descripción debe ser un texto",
        }),
        icon: joi.string().trim().max(50).pattern(iconPattern).allow("").default("").messages({
            "string.base": "El ícono debe ser un texto",
            "string.pattern.base": "El ícono solo puede contener letras, números, guiones y guiones bajos",
        }),
        color: joi.string().trim().pattern(colorPattern).allow("").default("").messages({
            "string.base": "El color debe ser un texto",
            "string.pattern.base": "El color debe ser un valor hexadecimal (#RRGGBB o #RGB)",
        }),
        status: joi.number().valid(0, 1).required().messages({
            "number.base": "El estado debe ser numérico",
            "any.only": "El estado debe ser 0 o 1",
            "any.required": "El estado es obligatorio",
        }),
    }).unknown(false);

    return schema.validate(data, { abortEarly: false });
}

export const loadRoutineTypeData = (data: any): ReturnRoutineTypeData => {
    const { error, value } = validateRoutineTypeData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};