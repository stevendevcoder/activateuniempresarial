import { Request, Response } from "express";
import crypto from "crypto";
import { MediaService } from "../../application/media.service";
import { extensionForMime } from "../../../../config/media";
import { loadVideoData } from "./validation/video.validation";

export class MediaController {
    private mediaService: MediaService;

    constructor(mediaService: MediaService) {
        this.mediaService = mediaService;
    }

    async uploadVideo(req: Request, res: Response): Promise<Response> {
        try {
            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: "No se recibió ningún archivo" });
            }

            const { title, description, durationSeconds, status } = loadVideoData(req.body);
            const videoId = await this.mediaService.createVideo({
                title,
                description,
                fileName: `${Date.now()}-${crypto.randomUUID()}${extensionForMime(file.mimetype)}`,
                filePath: "",
                mimeType: file.mimetype,
                size: file.size,
                durationSeconds,
                status,
                data: file.buffer,
            });

            return res.status(201).json({ message: "Video subido con éxito", videoId });
        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getAllVideos(req: Request, res: Response): Promise<Response> {
        try {
            const videos = await this.mediaService.getAllVideos();
            return res.status(200).json(videos);
        } catch (error) {
            return res.status(500).json({ error: "Error al obtener videos" });
        }
    }

    async getVideoById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const video = await this.mediaService.getVideoById(id);
            if (!video) {
                return res.status(404).json({ error: "Video no encontrado" });
            }
            return res.status(200).json(video);
        } catch (error) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async streamVideo(req: Request, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                res.status(400).json({ error: "ID inválido" });
                return;
            }

            const file = await this.mediaService.getVideoFile(id);
            if (!file) {
                res.status(404).json({ error: "Video no encontrado" });
                return;
            }

            res.type(file.mimeType).set("Content-Length", String(file.data.length)).send(file.data);
        } catch (error) {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async updateVideo(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const { title, description, durationSeconds, status } = loadVideoData(req.body);
            const updated = await this.mediaService.updateVideo(id, { title, description, durationSeconds, status });

            if (!updated) {
                return res.status(404).json({ error: "Video no encontrado" });
            }
            return res.status(200).json({ message: "Video actualizado con éxito" });
        } catch (error) {
            if (error instanceof Error && error.message === "Video no encontrado") {
                return res.status(404).json({ error: error.message });
            }
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async replaceVideoFile(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: "No se recibió ningún archivo" });
            }

            const replaced = await this.mediaService.replaceFile(id, {
                fileName: `${Date.now()}-${crypto.randomUUID()}${extensionForMime(file.mimetype)}`,
                filePath: "",
                mimeType: file.mimetype,
                size: file.size,
                data: file.buffer,
            });

            if (!replaced) {
                return res.status(404).json({ error: "Video no encontrado" });
            }
            return res.status(200).json({ message: "Archivo de video reemplazado con éxito" });
        } catch (error) {
            if (error instanceof Error && error.message === "Video no encontrado") {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async deleteVideo(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const deleted = await this.mediaService.deleteVideo(id);
            if (!deleted) {
                return res.status(404).json({ error: "Video no encontrado" });
            }
            return res.status(200).json({ message: "Video eliminado con éxito" });
        } catch (error) {
            if (error instanceof Error && error.message === "Video no encontrado") {
                return res.status(404).json({ error: error.message });
            }
            if (error instanceof Error && error.message.includes("asignado a una o más rutinas")) {
                return res.status(409).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}