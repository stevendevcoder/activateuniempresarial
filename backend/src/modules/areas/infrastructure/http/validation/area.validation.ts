import joi from "joi";

export type ReturnAreaData = {
    name: string;
    description: string;
    idResponsible: number | null;
    status: number;
};

function validateAreaData(data: any) {
    const areaSchema = joi.object({
        name: joi
            .string()
            .trim()
            .min(3)
            .max(255)
            .required()
            .messages({
                "string.base": "El nombre debe ser un texto",
                "string.empty": "El nombre es requerido",
                "string.min": "El nombre debe tener al menos 3 caracteres",
            }),
        description: joi.string().trim().max(255).allow("").default("").messages({
            "string.base": "La descripción debe ser un texto",
        }),
        idResponsible: joi.number().integer().positive().allow(null).default(null).messages({
            "number.base": "El responsable debe ser un ID de usuario",
            "number.positive": "El responsable debe ser un ID positivo",
        }),
        status: joi.number().valid(0, 1).required().messages({
            "number.base": "El estado debe ser numérico",
            "any.only": "El estado debe ser 0 o 1",
            "any.required": "El estado es obligatorio",
        }),
    }).unknown(false);

    return areaSchema.validate(data, { abortEarly: false });
}

export const loadAreaData = (data: any): ReturnAreaData => {
    const { error, value } = validateAreaData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};