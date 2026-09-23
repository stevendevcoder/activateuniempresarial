import { Request, Response } from "express";
import { ScheduleService } from "../service/schedule.service";
import { SchedulerService } from "../service/scheduler.service";
import { loadScheduleData, loadScheduleUpdateData } from "../validation/schedule.validation";
import { ScheduleEventFilters } from "../repository/schedule.repository";

export class ScheduleController {
    private scheduleService: ScheduleService;
    private schedulerService: SchedulerService;

    constructor(scheduleService: ScheduleService, schedulerService: SchedulerService) {
        this.scheduleService = scheduleService;
        this.schedulerService = schedulerService;
    }

    async getAllSchedules(_req: Request, res: Response): Promise<Response> {
        try {
            const schedules = await this.scheduleService.getAllSchedules();
            return res.status(200).json(schedules);
        } catch {
            return res.status(500).json({ error: "Error al obtener los cronogramas" });
        }
    }

    async getScheduleByArea(req: Request, res: Response): Promise<Response> {
        try {
            const idArea = Number(req.params.idArea);
            if (Number.isNaN(idArea)) {
                return res.status(400).json({ error: "ID de área inválido" });
            }
            const schedule = await this.scheduleService.getScheduleByArea(idArea);
            if (!schedule) {
                return res.status(404).json({ error: "El área no tiene cronograma configurado" });
            }
            return res.status(200).json(schedule);
        } catch {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getScheduleById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }
            const schedule = await this.scheduleService.getScheduleById(id);
            if (!schedule) {
                return res.status(404).json({ error: "Cronograma no encontrado" });
            }
            return res.status(200).json(schedule);
        } catch {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async createSchedule(req: Request, res: Response): Promise<Response> {
        try {
            const input = loadScheduleData(req.body);
            const scheduleId = await this.scheduleService.createSchedule(input);
            return res.status(201).json({ message: "Cronograma creado con éxito", scheduleId });
        } catch (error) {
            if (error instanceof Error && error.message === "El área ya tiene un cronograma configurado") {
                return res.status(409).json({ error: error.message });
            }
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async updateSchedule(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }
            const input = loadScheduleUpdateData(req.body);
            const updated = await this.scheduleService.updateSchedule(id, input);
            if (!updated) {
                return res.status(404).json({ error: "Cronograma no encontrado" });
            }
            return res.status(200).json({ message: "Cronograma actualizado con éxito" });
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                if (message === "Cronograma no encontrado") {
                    return res.status(404).json({ error: message });
                }
                if (message === "El área ya tiene un cronograma configurado") {
                    return res.status(409).json({ error: message });
                }
                return res.status(400).json({ error: message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async deleteSchedule(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }
            const deleted = await this.scheduleService.deleteSchedule(id);
            if (!deleted) {
                return res.status(404).json({ error: "Cronograma no encontrado" });
            }
            return res.status(200).json({ message: "Cronograma eliminado con éxito" });
        } catch (error) {
            if (error instanceof Error && error.message === "Cronograma no encontrado") {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async pauseSchedule(req: Request, res: Response): Promise<Response> {
        return this.setPaused(req, res, true);
    }

    async resumeSchedule(req: Request, res: Response): Promise<Response> {
        return this.setPaused(req, res, false);
    }

    private async setPaused(req: Request, res: Response, paused: boolean): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }
            const updated = paused
                ? await this.scheduleService.pauseSchedule(id)
                : await this.scheduleService.resumeSchedule(id);
            if (!updated) {
                return res.status(404).json({ error: "Cronograma no encontrado" });
            }
            return res.status(200).json({
                message: paused ? "Cronograma pausado" : "Cronograma reanudado",
            });
        } catch (error) {
            if (error instanceof Error && error.message === "Cronograma no encontrado") {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async listEvents(req: Request, res: Response): Promise<Response> {
        try {
            const filters: ScheduleEventFilters = {};
            if (req.query.areaId !== undefined) {
                const areaId = Number(req.query.areaId);
                if (!Number.isNaN(areaId)) filters.areaId = areaId;
            }
            if (typeof req.query.start === "string") filters.start = req.query.start;
            if (typeof req.query.end === "string") filters.end = req.query.end;
            if (req.query.limit !== undefined) {
                const limit = Number(req.query.limit);
                if (!Number.isNaN(limit) && limit > 0) filters.limit = limit;
            }

            const events = await this.scheduleService.listEvents(filters);
            return res.status(200).json(events);
        } catch {
            return res.status(500).json({ error: "Error al obtener los eventos" });
        }
    }

    async runScheduler(_req: Request, res: Response): Promise<Response> {
        try {
            const emitted = await this.schedulerService.runOnce();
            return res.status(200).json({ message: "Ciclo de programación ejecutado", emitted });
        } catch {
            return res.status(500).json({ error: "Error al ejecutar el ciclo de programación" });
        }
    }
}
