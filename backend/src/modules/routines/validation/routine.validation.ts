import joi from "joi";

export type ReturnRoutineData = {
    name: string;
    description: string;
    idRoutineType: number;
    status: number;
    videos: {
        idVideo: number;
        durationSeconds: number;
    }[];
};

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

function validateRoutineData(data: any) {
    const schema = joi.object({
        name: joi.string().trim().min(3).max(255).required().messages({
            "string.base": "El nombre debe ser un texto",
            "string.empty": "El nombre es requerido",
            "string.min": "El nombre debe tener al menos 3 caracteres",
        }),
        description: joi.string().trim().max(500).allow("").default("").messages({
            "string.base": "La descripción debe ser un texto",
        }),
        idRoutineType: joi.number().integer().positive().required().messages({
            "number.base": "El tipo de rutina debe ser un ID",
            "number.positive": "El tipo de rutina debe ser un ID positivo",
            "any.required": "El tipo de rutina es obligatorio",
        }),
        status: joi.number().valid(0, 1).required().messages({
            "number.base": "El estado debe ser numérico",
            "any.only": "El estado debe ser 0 o 1",
            "any.required": "El estado es obligatorio",
        }),
        videos: joi.array().items(videoItemSchema).min(1).required().messages({
            "array.base": "videos debe ser un arreglo",
            "array.min": "La rutina debe contener al menos un video",
            "any.required": "videos es obligatorio",
        }),
    }).unknown(false);

    return schema.validate(data, { abortEarly: false });
}

export const loadRoutineData = (data: any): ReturnRoutineData => {
    const { error, value } = validateRoutineData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};