import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../types/auth";
import { ConsentFilters } from "../repository/consent.repository";
import { PrivacyService } from "../service/privacy.service";
import { loadConsentData } from "../validation/consent.validation";

export class PrivacyController {
    constructor(private readonly privacyService: PrivacyService) {}

    async getConsentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "No autenticado" });
            return;
        }
        try {
            const status = await this.privacyService.getConsentStatus(userId);
            res.status(200).json(status);
        } catch {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async acceptConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "No autenticado" });
            return;
        }
        try {
            const data = loadConsentData(req.body);
            const consent = await this.privacyService.acceptConsent(userId, data.version);
            res.status(201).json({ message: "Consentimiento registrado", consent });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async revokeConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "No autenticado" });
            return;
        }
        try {
            const revoked = await this.privacyService.revokeConsent(userId);
            if (!revoked) {
                res.status(404).json({ error: "No hay un consentimiento activo" });
                return;
            }
            res.status(200).json({ message: "Consentimiento revocado" });
        } catch {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async requestDeletion(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "No autenticado" });
            return;
        }
        try {
            await this.privacyService.requestDataDeletion(userId);
            res.status(200).json({
                message: "Tus datos personales fueron eliminados. Los registros agregados se conservan anonimizados.",
            });
        } catch {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async listConsents(req: Request, res: Response): Promise<void> {
        try {
            const filters: ConsentFilters = { limit: 200 };
            if (req.query.userId !== undefined) {
                const userId = Number(req.query.userId);
                if (!Number.isNaN(userId)) filters.userId = userId;
            }
            const consents = await this.privacyService.listConsents(filters);
            res.status(200).json(consents);
        } catch {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async retentionPreview(_req: Request, res: Response): Promise<void> {
        try {
            const preview = await this.privacyService.retentionPreview();
            res.status(200).json(preview);
        } catch {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async runRetention(_req: Request, res: Response): Promise<void> {
        try {
            const result = await this.privacyService.runRetention();
            res.status(200).json({ message: "Política de retención aplicada", ...result });
        } catch {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}
