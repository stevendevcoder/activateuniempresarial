import joi from "joi";

export type ReturnUserData = {
    name: string;
    email: string;
    password: string;
    status: number;
    idRole: number | null;
    idArea: number | null;
};

function validateUserData(data: any) {
    const userSchema = joi.object({
        name: joi
            .string()
            .trim()
            .min(3)
            .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñ]+)?$/)
            .required()
            .messages({
                "string.base": "El nombre debe ser un texto",
                "string.empty": "El nombre es requerido",
                "string.min": "El nombre debe tener al menos 3 caracteres",
                "string.pattern.base": "El nombre solo puede contener letras y un espacio",
            }),
        email: joi
            .string()
            .email({ tlds: { allow: false } })
            .required()
            .messages({
                "string.email": "Correo electrónico no válido",
                "string.empty": "El correo es requerido",
            }),
        password: joi
            .string()
            .min(6)
            .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
            .required()
            .messages({
                "string.min": "La contraseña debe tener al menos 6 caracteres",
                "string.pattern.base": "La contraseña debe tener letras y números",
                "string.empty": "La contraseña es requerida",
            }),
        status: joi.number().valid(0, 1).required().messages({
            "number.base": "El estado debe ser numérico",
            "any.only": "El estado debe ser 0 o 1",
            "any.required": "El estado es obligatorio",
        }),
        idRole: joi.number().integer().positive().allow(null).default(null).messages({
            "number.base": "El rol debe ser un ID numérico",
            "number.positive": "El rol debe ser un ID positivo",
        }),
        idArea: joi.number().integer().positive().allow(null).default(null).messages({
            "number.base": "El área debe ser un ID numérico",
            "number.positive": "El área debe ser un ID positivo",
        }),
    }).unknown(false);

    return userSchema.validate(data, { abortEarly: false });
}

export const loadUserData = (data: any): ReturnUserData => {
    const { error, value } = validateUserData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};