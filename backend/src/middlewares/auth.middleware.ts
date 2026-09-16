import { Request, Response, NextFunction } from "express";
import { AuthService } from "../modules/auth/service/auth.service";

interface AuthRequest extends Request {
    user?: string | object;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "Error en autenticación" });
        return;
    }

    try {
        const payload = AuthService.verifyToken(token);
        req.user = payload;
        next();
    } catch (error) {
        res.status(403).json({ error: "Token inválido o expirado" });
        return;
    }
}