import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(statusCode: number, code: string, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, new.target);
    }
}

export function notFoundHandler(_req: Request, res: Response): void {
    res.status(404).json({ error: "Ruta no encontrada" });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
    }
    console.error("[unhandled]", err);
    res.status(500).json({ error: "Error interno del servidor" });
}
