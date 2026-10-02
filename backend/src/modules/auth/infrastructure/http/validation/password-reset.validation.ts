import joi from "joi";

function validate<T>(schema: joi.ObjectSchema<T>, data: unknown): T {
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
}

const forgotSchema = joi.object<{ email: string }>({
    email: joi.string().trim().email().required().messages({
        "string.empty": "El email es requerido",
        "string.email": "El email no es válido",
        "any.required": "El email es requerido",
    }),
}).unknown(false);

const resetSchema = joi.object<{ token: string; password: string }>({
    token: joi.string().trim().required().messages({
        "string.empty": "El token es requerido",
        "any.required": "El token es requerido",
    }),
    // Misma regla que al crear usuarios: mínimo 6 caracteres con letras y números.
    password: joi
        .string()
        .min(6)
        .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
        .required()
        .messages({
            "string.empty": "La contraseña es requerida",
            "string.min": "La contraseña debe tener al menos 6 caracteres",
            "string.pattern.base": "La contraseña debe tener letras y números (sin espacios ni símbolos)",
            "any.required": "La contraseña es requerida",
        }),
}).unknown(false);

export const loadForgotPasswordData = (data: unknown) => validate(forgotSchema, data);
export const loadResetPasswordData = (data: unknown) => validate(resetSchema, data);
