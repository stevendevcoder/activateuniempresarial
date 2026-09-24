import joi from "joi";

export type ReturnPermissionIdsData = {
    permissionIds: number[];
};

function validatePermissionIds(data: any) {
    const schema = joi
        .object({
            permissionIds: joi
                .array()
                .items(joi.number().integer().positive())
                .min(1)
                .unique()
                .required()
                .messages({
                    "array.base": "permissionIds debe ser un arreglo",
                    "array.min": "Se requiere al menos un permiso",
                    "array.unique": "No se permiten permisos duplicados",
                    "any.required": "permissionIds es obligatorio",
                }),
        })
        .unknown(false);

    return schema.validate(data, { abortEarly: false });
}

export const loadPermissionIdsData = (data: any): ReturnPermissionIdsData => {
    const { error, value } = validatePermissionIds(data);
    if (error) {
        throw new Error(error.details.map((d) => d.message).join(", "));
    }
    return value;
};