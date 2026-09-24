import joi from "joi";

export type ReturnUpdateUserData = Partial<{
    name: string;
    email: string;
    password: string;
    status: number;
    idRole: number | null;
    idArea: number | null;
}>;

function validateUpdateUserData(data: any) {
    const schema = joi
        .object({
            name: joi
                .string()
                .trim()
                .min(3)
                .pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñ]+)*$/)
                .messages({
                    "string.min": "El nombre debe tener al menos 3 caracteres",
                    "string.pattern.base": "El nombre solo puede contener letras y espacios",
                }),

            email: joi.string().trim().email({ tlds: { allow: false } }).messages({
                "string.email": "Correo electrónico no válido",
            }),

            password: joi
                .string()
                .min(6)
                .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
                .messages({
                    "string.min": "La contraseña debe tener al menos 6 caracteres",
                    "string.pattern.base": "La contraseña debe tener letras y números",
                }),

            status: joi.number().valid(0, 1).messages({
                "any.only": "El estado debe ser 0 (inactivo) o 1 (activo)",
                "number.base": "El estado debe ser numérico",
            }),

            idRole: joi.number().integer().positive().allow(null).messages({
                "number.base": "El rol debe ser un ID numérico",
                "number.positive": "El rol debe ser un ID positivo",
            }),

            idArea: joi.number().integer().positive().allow(null).messages({
                "number.base": "El área debe ser un ID numérico",
                "number.positive": "El área debe ser un ID positivo",
            }),
        })
        .unknown(false)
        .or("name", "email", "password", "status", "idRole", "idArea");

    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });
}

export const loadUpdateUserData = (data: any): ReturnUpdateUserData => {
    const { error, value } = validateUpdateUserData(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};