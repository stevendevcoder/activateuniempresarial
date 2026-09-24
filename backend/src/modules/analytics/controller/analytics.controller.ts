import { Request, Response } from "express";
import { AnalyticsService } from "../service/analytics.service";
import { loadAnalyticsQuery } from "../validation/analytics.validation";

export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    async getSummary(req: Request, res: Response): Promise<void> {
        try {
            const query = loadAnalyticsQuery(req.query);
            const data = await this.analyticsService.summary(query);
            res.status(200).json(data);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getTimeline(req: Request, res: Response): Promise<void> {
        try {
            const query = loadAnalyticsQuery(req.query);
            const data = await this.analyticsService.timeline(query, query.granularity ?? "day");
            res.status(200).json(data);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getAreas(req: Request, res: Response): Promise<void> {
        try {
            const query = loadAnalyticsQuery(req.query);
            const data = await this.analyticsService.areas(query);
            res.status(200).json(data);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async exportPdf(req: Request, res: Response): Promise<void> {
        try {
            const query = loadAnalyticsQuery(req.query);
            const buffer = await this.analyticsService.exportPdf(query, query.anonymous ?? false);
            res
                .setHeader("Content-Type", "application/pdf")
                .setHeader("Content-Disposition", 'attachment; filename="informe-pausas-activas.pdf"')
                .status(200)
                .end(buffer);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async exportExcel(req: Request, res: Response): Promise<void> {
        try {
            const query = loadAnalyticsQuery(req.query);
            const buffer = await this.analyticsService.exportExcel(query, query.anonymous ?? false);
            res
                .setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .setHeader("Content-Disposition", 'attachment; filename="reporte-pausas-activas.xlsx"')
                .status(200)
                .end(buffer);
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}