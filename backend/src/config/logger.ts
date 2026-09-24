import pino from "pino";
import envs from "./environment-vars";

export const logger =
    envs.NODE_ENV === "development"
        ? pino({ level: "debug", transport: { target: "pino/file", options: { destination: 1 } } })
        : pino({ level: "info" });

export function createRequestLogger(): pino.Logger {
    return logger.child({ module: "http" });
}
