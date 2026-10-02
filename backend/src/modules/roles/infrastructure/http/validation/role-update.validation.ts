import joi from "joi";

export type ReturnRoleUpdateData = Partial<{
    name: string;
    description: string;
    status: number;
}>;

function validateRoleUpdateData(data: any) {
    const schema = joi
        .object({
            name: joi
                .string()
                .trim()
                .min(3)
                .max(100)
                .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñ0-9]+)*$/)
                .messages({
                    "string.min": "El nombre debe tener al menos 3 caracteres",
                    "string.pattern.base": "El nombre solo puede contener letras, números y espacios",
                }),
            description: joi.string().trim().max(255).allow("").messages({
                "string.base": "La descripción debe ser un texto",
            }),
            status: joi.number().valid(0, 1).messages({
                "any.only": "El estado debe ser 0 o 1",
                "number.base": "El estado debe ser numérico",
            }),
        })
        .unknown(false)
        .or("name", "description", "status");

    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });
}

export const loadRoleUpdateData = (data: any): ReturnRoleUpdateData => {
    const { error, value } = validateRoleUpdateData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};