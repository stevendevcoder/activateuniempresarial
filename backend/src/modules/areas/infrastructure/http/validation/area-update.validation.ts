import joi from "joi";

export type ReturnAreaUpdateData = Partial<{
    name: string;
    description: string;
    idResponsible: number | null;
    status: number;
}>;

function validateAreaUpdateData(data: any) {
    const schema = joi
        .object({
            name: joi.string().trim().min(3).max(255).messages({
                "string.min": "El nombre debe tener al menos 3 caracteres",
            }),
            description: joi.string().trim().max(255).allow("").messages({
                "string.base": "La descripción debe ser un texto",
            }),
            idResponsible: joi.number().integer().positive().allow(null).messages({
                "number.base": "El responsable debe ser un ID de usuario",
                "number.positive": "El responsable debe ser un ID positivo",
            }),
            status: joi.number().valid(0, 1).messages({
                "any.only": "El estado debe ser 0 o 1",
            }),
        })
        .unknown(false)
        .or("name", "description", "idResponsible", "status");

    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });
}

export const loadAreaUpdateData = (data: any): ReturnAreaUpdateData => {
    const { error, value } = validateAreaUpdateData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};