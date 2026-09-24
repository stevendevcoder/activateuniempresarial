import joi from "joi";

export type ReturnRoutineStatusData = {
    status: number;
};

function validateRoutineStatusData(data: any) {
    const schema = joi.object({
        status: joi.number().valid(0, 1).required().messages({
            "number.base": "El estado debe ser numérico",
            "any.only": "El estado debe ser 0 o 1",
            "any.required": "El estado es obligatorio",
        }),
    }).unknown(false);

    return schema.validate(data, { abortEarly: false });
}

export const loadRoutineStatusData = (data: any): ReturnRoutineStatusData => {
    const { error, value } = validateRoutineStatusData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};