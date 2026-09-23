import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../../types/auth";
import { TelemetryFilters } from "../repository/telemetry.repository";
import { TelemetryService } from "../service/telemetry.service";
import { loadTelemetryBatch, loadTelemetryEvent } from "../validation/telemetry.validation";

export class TelemetryController {
    constructor(private readonly telemetryService: TelemetryService) {}

    private buildFilters(query: Request["query"], includeUser: boolean): TelemetryFilters {
        const filters: TelemetryFilters = {};
        if (includeUser && query.userId !== undefined) {
            const userId = Number(query.userId);
            if (!Number.isNaN(userId)) filters.userId = userId;
        }
        if (query.areaId !== undefined) {
            const areaId = Number(query.areaId);
            if (!Number.isNaN(areaId)) filters.areaId = areaId;
        }
        if (query.type !== undefined) {
            const type = Number(query.type);
            if (!Number.isNaN(type)) filters.type = type;
        }
        if (typeof query.start === "string") filters.start = query.start;
        if (typeof query.end === "string") filters.end = query.end;
        if (query.limit !== undefined) {
            const limit = Number(query.limit);
            if (!Number.isNaN(limit) && limit > 0) filters.limit = limit;
        }
        return filters;
    }

    async ingest(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "No autenticado" });
            return;
        }
        try {
            const data = loadTelemetryEvent(req.body);
            const eventId = await this.telemetryService.record(userId, data);
            res.status(201).json({ message: "Evento registrado", eventId });
        } catch (error) {
            this.handleError(error, res);
        }
    }

    async ingestBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "No autenticado" });
            return;
        }
        try {
            const items = loadTelemetryBatch(req.body);
            const count = await this.telemetryService.recordBatch(userId, items);
            res.status(201).json({ message: "Eventos registrados", count });
        } catch (error) {
            this.handleError(error, res);
        }
    }

    async listMine(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: "No autenticado" });
            return;
        }
        try {
            const filters = this.buildFilters(req.query, false);
            const events = await this.telemetryService.listMine(userId, filters);
            res.status(200).json(events);
        } catch {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async list(req: Request, res: Response): Promise<void> {
        try {
            const filters = this.buildFilters(req.query, true);
            const events = await this.telemetryService.list(filters);
            res.status(200).json(events);
        } catch {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async summary(req: Request, res: Response): Promise<void> {
        try {
            const filters = this.buildFilters(req.query, true);
            const data = await this.telemetryService.summary(filters);
            res.status(200).json(data);
        } catch {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    private handleError(error: unknown, res: Response): void {
        if (error instanceof Error) {
            if (error.message.includes("límite máximo de aplazamientos")) {
                res.status(409).json({ error: error.message });
                return;
            }
            if (error.message.includes("no existe") || error.message.includes("no pertenece")) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
