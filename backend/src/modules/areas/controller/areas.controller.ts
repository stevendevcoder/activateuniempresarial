import { Request, Response } from "express";
import { AreasService } from "../service/areas.service";
import { loadAreaData } from "../validation/area.validation";
import { loadAreaUpdateData } from "../validation/area-update.validation";

export class AreasController {
    private areasService: AreasService;

    constructor(areasService: AreasService) {
        this.areasService = areasService;
    }

    async createArea(req: Request, res: Response): Promise<Response> {
        try {
            const { name, description, idResponsible, status } = loadAreaData(req.body);
            const areaId = await this.areasService.createArea({ name, description, idResponsible, status });
            return res.status(201).json({ message: "Área creada con éxito", areaId });
        } catch (error) {
            if (error instanceof Error && error.message === "Ya existe un área con ese nombre") {
                return res.status(409).json({ error: error.message });
            }
            if (error instanceof Error && error.message.includes("responsable")) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async updateArea(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const data = loadAreaUpdateData(req.body);
            const updated = await this.areasService.updateArea(id, data);

            if (!updated) {
                return res.status(404).json({ error: "Área no encontrada o sin cambios" });
            }
            return res.status(200).json({ message: "Área actualizada con éxito" });
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                if (message === "Área no encontrada") {
                    return res.status(404).json({ error: message });
                }
                if (message === "Ya existe otra área con ese nombre") {
                    return res.status(409).json({ error: message });
                }
                return res.status(400).json({ error: message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async deleteArea(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const deleted = await this.areasService.deleteArea(id);
            if (!deleted) {
                return res.status(404).json({ error: "Área no encontrada" });
            }
            return res.status(200).json({ message: "Área eliminada con éxito" });
        } catch (error) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getAreaById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const area = await this.areasService.getAreaById(id);
            if (!area) {
                return res.status(404).json({ error: "Área no encontrada" });
            }
            return res.status(200).json(area);
        } catch (error) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getAllAreas(req: Request, res: Response): Promise<Response> {
        try {
            const areas = await this.areasService.getAllAreas();
            return res.status(200).json(areas);
        } catch (error) {
            return res.status(500).json({ error: "Error al obtener áreas" });
        }
    }
}