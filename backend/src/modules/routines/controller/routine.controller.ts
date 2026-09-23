import { Request, Response } from "express";
import { RoutineService } from "../service/routine.service";
import { loadRoutineData } from "../validation/routine.validation";
import { loadRoutineUpdateData } from "../validation/routine-update.validation";
import { loadRoutineStatusData } from "../validation/routine-status.validation";

export class RoutineController {
    private routineService: RoutineService;

    constructor(routineService: RoutineService) {
        this.routineService = routineService;
    }

    async createRoutine(req: Request, res: Response): Promise<Response> {
        try {
            const { name, description, idRoutineType, status, videos } = loadRoutineData(req.body);
            const routineId = await this.routineService.createRoutine({ name, description, idRoutineType, status, videos });
            return res.status(201).json({ message: "Rutina creada con éxito", routineId });
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                if (message.includes("tipo de rutina") || message.includes("video con ID")) {
                    return res.status(400).json({ error: message });
                }
                return res.status(400).json({ error: message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async updateRoutine(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const data = loadRoutineUpdateData(req.body);
            const updated = await this.routineService.updateRoutine(id, data);

            if (!updated) {
                return res.status(404).json({ error: "Rutina no encontrada o sin cambios" });
            }
            return res.status(200).json({ message: "Rutina actualizada con éxito" });
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                if (message === "Rutina no encontrada") {
                    return res.status(404).json({ error: message });
                }
                if (message.includes("tipo de rutina") || message.includes("video con ID")) {
                    return res.status(400).json({ error: message });
                }
                return res.status(400).json({ error: message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async deleteRoutine(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const deleted = await this.routineService.deleteRoutine(id);
            if (!deleted) {
                return res.status(404).json({ error: "Rutina no encontrada" });
            }
            return res.status(200).json({ message: "Rutina eliminada con éxito" });
        } catch (error) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async setStatus(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const { status } = loadRoutineStatusData(req.body);
            const updated = await this.routineService.setRoutineStatus(id, status);

            if (!updated) {
                return res.status(404).json({ error: "Rutina no encontrada" });
            }
            const message = status === 1 ? "Rutina activada con éxito" : "Rutina desactivada con éxito";
            return res.status(200).json({ message });
        } catch (error) {
            if (error instanceof Error && error.message === "Rutina no encontrada") {
                return res.status(404).json({ error: error.message });
            }
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getRoutineById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const routine = await this.routineService.getRoutineById(id);
            if (!routine) {
                return res.status(404).json({ error: "Rutina no encontrada" });
            }
            return res.status(200).json(routine);
        } catch (error) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getAllRoutines(req: Request, res: Response): Promise<Response> {
        try {
            const routines = await this.routineService.getAllRoutines();
            return res.status(200).json(routines);
        } catch (error) {
            return res.status(500).json({ error: "Error al obtener rutinas" });
        }
    }
}