import joi from "joi";

export type ReturnRoutineTypeUpdateData = Partial<{
    name: string;
    description: string;
    icon: string;
    color: string;
    status: number;
}>;

const colorPattern = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const iconPattern = /^[a-zA-Z0-9_-]{1,50}$/;

function validateRoutineTypeUpdateData(data: any) {
    const schema = joi
        .object({
            name: joi.string().trim().min(3).max(100).messages({
                "string.min": "El nombre debe tener al menos 3 caracteres",
            }),
            description: joi.string().trim().max(255).allow("").messages({
                "string.base": "La descripción debe ser un texto",
            }),
            icon: joi.string().trim().max(50).pattern(iconPattern).allow("").messages({
                "string.pattern.base": "El ícono solo puede contener letras, números, guiones y guiones bajos",
            }),
            color: joi.string().trim().pattern(colorPattern).allow("").messages({
                "string.pattern.base": "El color debe ser un valor hexadecimal (#RRGGBB o #RGB)",
            }),
            status: joi.number().valid(0, 1).messages({
                "any.only": "El estado debe ser 0 o 1",
            }),
        })
        .unknown(false)
        .or("name", "description", "icon", "color", "status");

    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });
}

export const loadRoutineTypeUpdateData = (data: any): ReturnRoutineTypeUpdateData => {
    const { error, value } = validateRoutineTypeUpdateData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};