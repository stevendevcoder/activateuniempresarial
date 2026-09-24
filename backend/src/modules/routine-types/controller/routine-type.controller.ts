import { Request, Response } from "express";
import { RoutineTypeService } from "../service/routine-type.service";
import { loadRoutineTypeData } from "../validation/routine-type.validation";
import { loadRoutineTypeUpdateData } from "../validation/routine-type-update.validation";

export class RoutineTypeController {
    private routineTypeService: RoutineTypeService;

    constructor(routineTypeService: RoutineTypeService) {
        this.routineTypeService = routineTypeService;
    }

    async createType(req: Request, res: Response): Promise<Response> {
        try {
            const { name, description, icon, color, status } = loadRoutineTypeData(req.body);
            const typeId = await this.routineTypeService.createType({ name, description, icon, color, status });
            return res.status(201).json({ message: "Tipo de rutina creado con éxito", typeId });
        } catch (error) {
            if (error instanceof Error && error.message === "Ya existe un tipo de rutina con ese nombre") {
                return res.status(409).json({ error: error.message });
            }
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async updateType(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const data = loadRoutineTypeUpdateData(req.body);
            const updated = await this.routineTypeService.updateType(id, data);

            if (!updated) {
                return res.status(404).json({ error: "Tipo de rutina no encontrado o sin cambios" });
            }
            return res.status(200).json({ message: "Tipo de rutina actualizado con éxito" });
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                if (message === "Tipo de rutina no encontrado") {
                    return res.status(404).json({ error: message });
                }
                if (message === "Ya existe otro tipo de rutina con ese nombre") {
                    return res.status(409).json({ error: message });
                }
                return res.status(400).json({ error: message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async deleteType(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const deleted = await this.routineTypeService.deleteType(id);
            if (!deleted) {
                return res.status(404).json({ error: "Tipo de rutina no encontrado" });
            }
            return res.status(200).json({ message: "Tipo de rutina eliminado con éxito" });
        } catch (error) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getTypeById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const type = await this.routineTypeService.getTypeById(id);
            if (!type) {
                return res.status(404).json({ error: "Tipo de rutina no encontrado" });
            }
            return res.status(200).json(type);
        } catch (error) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getAllTypes(req: Request, res: Response): Promise<Response> {
        try {
            const types = await this.routineTypeService.getAllTypes();
            return res.status(200).json(types);
        } catch (error) {
            return res.status(500).json({ error: "Error al obtener tipos de rutina" });
        }
    }
}