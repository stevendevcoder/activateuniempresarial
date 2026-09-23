import joi from "joi";

export type ReturnRoutineUpdateData = Partial<{
    name: string;
    description: string;
    idRoutineType: number;
    status: number;
    videos: {
        idVideo: number;
        durationSeconds: number;
    }[];
}>;

const videoItemSchema = joi.object({
    idVideo: joi.number().integer().positive().required().messages({
        "number.base": "idVideo debe ser numérico",
        "number.positive": "idVideo debe ser positivo",
        "any.required": "idVideo es obligatorio",
    }),
    durationSeconds: joi.number().integer().positive().required().messages({
        "number.base": "durationSeconds debe ser numérico",
        "number.positive": "durationSeconds debe ser mayor a 0",
        "any.required": "durationSeconds es obligatorio",
    }),
});

function validateRoutineUpdateData(data: any) {
    const schema = joi
        .object({
            name: joi.string().trim().min(3).max(255).messages({
                "string.base": "El nombre debe ser un texto",
                "string.min": "El nombre debe tener al menos 3 caracteres",
            }),
            description: joi.string().trim().max(500).allow("").messages({
                "string.base": "La descripción debe ser un texto",
            }),
            idRoutineType: joi.number().integer().positive().messages({
                "number.base": "El tipo de rutina debe ser un ID",
                "number.positive": "El tipo de rutina debe ser un ID positivo",
            }),
            status: joi.number().valid(0, 1).messages({
                "any.only": "El estado debe ser 0 o 1",
            }),
            videos: joi.array().items(videoItemSchema).min(1).messages({
                "array.base": "videos debe ser un arreglo",
                "array.min": "La rutina debe contener al menos un video",
            }),
        })
        .unknown(false)
        .or("name", "description", "idRoutineType", "status", "videos");

    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });
}

export const loadRoutineUpdateData = (data: any): ReturnRoutineUpdateData => {
    const { error, value } = validateRoutineUpdateData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};