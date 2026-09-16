import joi from "joi";
import "dotenv/config";

export type ReturnEnvironmentVars = {
    PORT: number;
    NODE_ENV: "development" | "production" | "test";
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    BCRYPT_ROUNDS: number;
    CORS_ORIGIN: string;
};

type ValidationEnvironmentVars = {
    error: joi.ValidationError | undefined;
    value: ReturnEnvironmentVars;
};

function validateEnvVars(vars: NodeJS.ProcessEnv): ValidationEnvironmentVars {
    const envSchema = joi.object({
        PORT: joi.number().default(3000),
        NODE_ENV: joi.string().valid("development", "production", "test").default("development"),
        DATABASE_URL: joi.string().required(),
        JWT_SECRET: joi.string().required(),
        JWT_EXPIRES_IN: joi.string().default("1h"),
        BCRYPT_ROUNDS: joi.number().default(12),
        CORS_ORIGIN: joi.string().default("*"),
    }).unknown(true);

    const { error, value } = envSchema.validate(vars);
    return { error, value };
}

const loadEnvVars = (): ReturnEnvironmentVars => {
    const result = validateEnvVars(process.env);
    if (result.error) {
        throw new Error(result.error.message);
    }
    const value = result.value;
    return {
        PORT: value.PORT,
        NODE_ENV: value.NODE_ENV,
        DATABASE_URL: value.DATABASE_URL,
        JWT_SECRET: value.JWT_SECRET,
        JWT_EXPIRES_IN: value.JWT_EXPIRES_IN,
        BCRYPT_ROUNDS: value.BCRYPT_ROUNDS,
        CORS_ORIGIN: value.CORS_ORIGIN,
    };
};

const envs = loadEnvVars();
export default envs;