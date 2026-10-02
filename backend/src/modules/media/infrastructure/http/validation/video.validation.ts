import joi from "joi";

export type ReturnVideoData = {
    title: string;
    description: string;
    durationSeconds: number;
    status: number;
};

function validateVideoData(data: any) {
    const videoSchema = joi.object({
        title: joi.string().trim().min(1).max(255).required().messages({
            "string.base": "El título debe ser un texto",
            "string.empty": "El título es requerido",
            "string.max": "El título no puede superar 255 caracteres",
        }),
        description: joi.string().trim().max(500).allow("").default("").messages({
            "string.base": "La descripción debe ser un texto",
        }),
        durationSeconds: joi.number().integer().min(0).default(0).messages({
            "number.base": "La duración debe ser numérica",
            "number.min": "La duración no puede ser negativa",
        }),
        status: joi.number().valid(0, 1).default(1).messages({
            "any.only": "El estado debe ser 0 o 1",
            "number.base": "El estado debe ser numérico",
        }),
    }).unknown(false);

    return videoSchema.validate(data, { abortEarly: false });
}

export const loadVideoData = (data: any): ReturnVideoData => {
    const { error, value } = validateVideoData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};