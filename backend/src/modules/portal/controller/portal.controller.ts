import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../types/auth";
import { toPublicUser } from "../../auth/repository/user.repository";
import { PausaStatus, UserHistoryFilters } from "../../pausas/repository/pausa.repository";
import { PortalService } from "../service/portal.service";
import {
    loadHistoryQuery,
    loadProfileUpdateData,
    loadRegisterPauseData,
    loadStatusTransitionData,
} from "../validation/portal.validation";

export class PortalController {
    constructor(private readonly portalService: PortalService) {}

    async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: "No autenticado" });
                return;
            }
            const query = loadHistoryQuery(req.query);
            const filters: UserHistoryFilters = { limit: query.limit, offset: query.offset };
            if (query.status !== undefined) filters.status = query.status;
            if (query.start !== undefined) filters.start = query.start;
            if (query.end !== undefined) filters.end = query.end;

            const data = await this.portalService.history(userId, filters);
            res.status(200).json({ ...data, limit: query.limit, offset: query.offset });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: "No autenticado" });
                return;
            }
            const data = await this.portalService.stats(userId);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getStreak(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: "No autenticado" });
                return;
            }
            const data = await this.portalService.streak(userId);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async registerPause(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: "No autenticado" });
                return;
            }
            const data = loadRegisterPauseData(req.body);
            const input: { routineId: number | null; scheduledAt?: string; status?: PausaStatus } = {
                routineId: data.routineId,
            };
            if (data.scheduledAt !== undefined) input.scheduledAt = data.scheduledAt;
            if (data.status !== undefined) input.status = data.status;

            const pausa = await this.portalService.register(userId, input);
            res.status(201).json({ message: "Pausa registrada con éxito", pausa });
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                if (message === "Pausa no encontrada" || message === "La rutina indicada no existe" || message === "La rutina indicada está inactiva") {
                    res.status(400).json({ error: message });
                    return;
                }
                res.status(400).json({ error: message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async updatePauseStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: "No autenticado" });
                return;
            }
            const pausaId = Number(req.params.id);
            if (Number.isNaN(pausaId)) {
                res.status(400).json({ error: "ID inválido" });
                return;
            }
            const { status } = loadStatusTransitionData(req.body);
            const pausa = await this.portalService.updateStatus(userId, pausaId, status);
            res.status(200).json({ message: "Estado de la pausa actualizado", pausa });
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                if (message === "Pausa no encontrada") {
                    res.status(404).json({ error: message });
                    return;
                }
                if (message.includes("permisos")) {
                    res.status(403).json({ error: message });
                    return;
                }
                res.status(400).json({ error: message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: "No autenticado" });
                return;
            }
            const data = loadProfileUpdateData(req.body);
            const user = await this.portalService.updateProfile(userId, data);
            res.status(200).json({ message: "Perfil actualizado con éxito", user: toPublicUser(user) });
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                if (message === "Usuario no encontrado") {
                    res.status(404).json({ error: message });
                    return;
                }
                if (message === "La contraseña actual es incorrecta" || message.includes("confirmar")) {
                    res.status(400).json({ error: message });
                    return;
                }
                res.status(400).json({ error: message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async uploadPhoto(req: Request, res: Response): Promise<void> {
        try {
            const { user } = req as AuthenticatedRequest;
            if (!user) {
                res.status(401).json({ error: "No autenticado" });
                return;
            }
            const file = req.file;
            if (!file) {
                res.status(400).json({ error: "No se recibió ninguna imagen" });
                return;
            }

            const photoUrl = await this.portalService.updatePhoto(user.id, file.filename);
            res.status(200).json({ message: "Foto de perfil actualizada", photoUrl });
        } catch (error) {
            if (error instanceof Error && error.message === "Usuario no encontrado") {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}