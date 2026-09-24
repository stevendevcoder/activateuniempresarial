import joi from "joi";

export type ReturnRoleData = {
    name: string;
    description: string;
    status: number;
};

function validateRoleData(data: any) {
    const roleSchema = joi.object({
        name: joi
            .string()
            .trim()
            .min(3)
            .max(100)
            .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñ0-9]+)*$/)
            .required()
            .messages({
                "string.base": "El nombre debe ser un texto",
                "string.empty": "El nombre es requerido",
                "string.min": "El nombre debe tener al menos 3 caracteres",
                "string.pattern.base": "El nombre solo puede contener letras, números y espacios",
            }),
        description: joi.string().trim().max(255).allow("").default("").messages({
            "string.base": "La descripción debe ser un texto",
        }),
        status: joi.number().valid(0, 1).required().messages({
            "number.base": "El estado debe ser numérico",
            "any.only": "El estado debe ser 0 o 1",
            "any.required": "El estado es obligatorio",
        }),
    }).unknown(false);

    return roleSchema.validate(data, { abortEarly: false });
}

export const loadRoleData = (data: any): ReturnRoleData => {
    const { error, value } = validateRoleData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};