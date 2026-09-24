import { NextFunction, Response } from "express";
import { AuthService } from "../modules/auth/service/auth.service";
import { AuthenticatedRequest, AuthUserPayload } from "../types/auth";

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "Error en autenticación" });
        return;
    }

    try {
        const payload = AuthService.verifyToken(token) as AuthUserPayload;
        req.user = payload;
        next();
    } catch (error) {
        res.status(403).json({ error: "Token inválido o expirado" });
        return;
    }
}