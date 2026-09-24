import { Request, Response } from "express";
import { ConfigService } from "../service/config.service";
import { loadConfigUpdateData } from "../validation/config.validation";
import { loadHolidayData } from "../validation/holiday.validation";

export class ConfigController {
    private configService: ConfigService;

    constructor(configService: ConfigService) {
        this.configService = configService;
    }

    async getConfig(_req: Request, res: Response): Promise<Response> {
        try {
            const config = await this.configService.getConfig();
            return res.status(200).json(config);
        } catch {
            return res.status(500).json({ error: "Error al obtener la configuración" });
        }
    }

    async updateConfig(req: Request, res: Response): Promise<Response> {
        try {
            const input = loadConfigUpdateData(req.body);
            const config = await this.configService.updateConfig(input);
            return res.status(200).json({ message: "Configuración actualizada con éxito", config });
        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async listHolidays(_req: Request, res: Response): Promise<Response> {
        try {
            const holidays = await this.configService.listHolidays();
            return res.status(200).json(holidays);
        } catch {
            return res.status(500).json({ error: "Error al obtener los festivos" });
        }
    }

    async createHoliday(req: Request, res: Response): Promise<Response> {
        try {
            const input = loadHolidayData(req.body);
            const holidayId = await this.configService.createHoliday(input);
            return res.status(201).json({ message: "Festivo registrado con éxito", holidayId });
        } catch (error) {
            if (error instanceof Error && error.message === "Ya existe un festivo registrado en esa fecha") {
                return res.status(409).json({ error: error.message });
            }
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async deleteHoliday(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }
            const deleted = await this.configService.deleteHoliday(id);
            if (!deleted) {
                return res.status(404).json({ error: "Festivo no encontrado" });
            }
            return res.status(200).json({ message: "Festivo eliminado con éxito" });
        } catch (error) {
            if (error instanceof Error && error.message === "Festivo no encontrado") {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}
