import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types/auth";

export function requireRole(...roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        const userRole = req.user?.role ?? null;
        if (!userRole || !roles.includes(userRole)) {
            res.status(403).json({ error: "Acceso denegado para este rol" });
            return;
        }
        next();
    };
}

export function requirePermission(permission: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        const permissions = req.user?.permissions ?? [];
        if (!permissions.includes("*") && !permissions.includes(permission)) {
            res.status(403).json({ error: "No tiene permiso para realizar esta operación" });
            return;
        }
        next();
    };
}