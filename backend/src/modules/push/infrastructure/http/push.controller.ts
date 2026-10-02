import { Response } from "express";
import joi from "joi";
import { AuthenticatedRequest } from "../../../../types/auth";
import { PushService, PushSubscriptionInput } from "../../application/push.service";

// `expirationTime` lo envía el navegador dentro de la suscripción; no se guarda.
const subscriptionSchema = joi.object({
    endpoint: joi.string().uri({ scheme: ["https", "http"] }).max(2000).required(),
    expirationTime: joi.any().strip(),
    keys: joi.object({
        p256dh: joi.string().max(255).required(),
        auth: joi.string().max(255).required(),
    }).required(),
}).unknown(false);

const endpointSchema = joi.object<{ endpoint: string }>({
    endpoint: joi.string().max(2000).required(),
}).unknown(false);

export class PushController {
    private pushService: PushService;

    constructor(pushService: PushService) {
        this.pushService = pushService;
    }

    getPublicKey(_req: AuthenticatedRequest, res: Response): Response {
        const publicKey = this.pushService.getPublicKey();
        if (!publicKey) {
            return res.status(503).json({ error: "Las notificaciones push no están configuradas en el servidor" });
        }
        return res.status(200).json({ publicKey });
    }

    async subscribe(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const { error, value } = subscriptionSchema.validate(req.body) as { error?: joi.ValidationError; value: PushSubscriptionInput };
        if (error) {
            return res.status(400).json({ error: "Suscripción push inválida" });
        }
        try {
            await this.pushService.subscribe(req.user!.id, value, req.get("user-agent") ?? null);
            return res.status(201).json({ message: "Notificaciones activadas en este dispositivo" });
        } catch {
            return res.status(500).json({ error: "No se pudo registrar la suscripción" });
        }
    }

    async unsubscribe(req: AuthenticatedRequest, res: Response): Promise<Response> {
        const { error, value } = endpointSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: "Endpoint requerido" });
        }
        await this.pushService.unsubscribe(req.user!.id, value.endpoint);
        return res.status(200).json({ message: "Notificaciones desactivadas en este dispositivo" });
    }

    async sendTest(req: AuthenticatedRequest, res: Response): Promise<Response> {
        if (!this.pushService.getPublicKey()) {
            return res.status(503).json({ error: "Las notificaciones push no están configuradas en el servidor" });
        }
        const delivered = await this.pushService.sendToUser(req.user!.id, {
            type: "test",
            title: "Notificaciones activadas",
            body: "Así te avisaremos cuando sea hora de tu pausa activa.",
            url: "/app/notificaciones",
            tag: "push-test",
        });
        if (delivered === 0) {
            return res.status(404).json({ error: "No hay dispositivos suscritos para tu usuario" });
        }
        return res.status(200).json({ message: "Notificación de prueba enviada", delivered });
    }
}
