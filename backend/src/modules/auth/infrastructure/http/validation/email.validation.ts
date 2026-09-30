import joi from "joi";

export type ReturnEmail = {
    email: string;
};

function validateEmail(data: any) {
    const emailSchema = joi
        .object({
            email: joi
                .string()
                .email({ tlds: { allow: false } })
                .required()
                .messages({
                    "string.email": "Correo electrónico no válido",
                    "string.empty": "El correo es requerido",
                }),
        })
        .unknown(false);

    return emailSchema.validate(data, { abortEarly: false });
}

export const loadEmail = (data: any): ReturnEmail => {
    const { error, value } = validateEmail(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};