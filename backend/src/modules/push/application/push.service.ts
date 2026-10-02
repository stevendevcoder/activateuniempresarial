import webpush, { WebPushError } from "web-push";
import { Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import envs from "../../../config/environment-vars";
import { formatTimeInTz } from "../../../utils/timezone";
import { PausaDueEvent } from "../../../events/scheduler.events";
import { Routine } from "../../routines/infrastructure/persistence/routine.entity";
import { PushSubscription } from "../infrastructure/persistence/push-subscription.entity";

export interface PushSubscriptionInput {
    endpoint: string;
    keys: { p256dh: string; auth: string };
}

/** Contenido que recibe el service worker del navegador (frontend/public/sw-push.js). */
export interface PushPayload {
    type: "pausa-due" | "test";
    title: string;
    body: string;
    url: string;
    tag: string;
    data?: Record<string, unknown>;
}

let vapidConfigured = false;

export function isPushEnabled(): boolean {
    if (vapidConfigured) return true;
    if (!envs.VAPID_PUBLIC_KEY || !envs.VAPID_PRIVATE_KEY) return false;
    webpush.setVapidDetails(envs.VAPID_SUBJECT, envs.VAPID_PUBLIC_KEY, envs.VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    return true;
}

export class PushService {
    private subscriptionRepo: Repository<PushSubscription>;
    private routineRepo: Repository<Routine>;

    constructor() {
        this.subscriptionRepo = AppDataSource.getRepository(PushSubscription);
        this.routineRepo = AppDataSource.getRepository(Routine);
    }

    getPublicKey(): string | null {
        return isPushEnabled() ? envs.VAPID_PUBLIC_KEY : null;
    }

    /** Registra (o reasigna al usuario actual) la suscripción de este navegador. */
    async subscribe(idUser: number, input: PushSubscriptionInput, userAgent: string | null): Promise<void> {
        const existing = await this.subscriptionRepo.findOne({ where: { endpoint: input.endpoint } });
        const entity = existing ?? this.subscriptionRepo.create({ endpoint: input.endpoint });
        entity.id_user = idUser;
        entity.p256dh = input.keys.p256dh;
        entity.auth = input.keys.auth;
        entity.user_agent = userAgent ? userAgent.slice(0, 255) : null;
        await this.subscriptionRepo.save(entity);
    }

    async unsubscribe(idUser: number, endpoint: string): Promise<void> {
        await this.subscriptionRepo.delete({ id_user: idUser, endpoint });
    }

    /** Envía un aviso a todos los dispositivos del usuario. Devuelve cuántos lo recibieron. */
    async sendToUser(idUser: number, payload: PushPayload): Promise<number> {
        const subscriptions = await this.subscriptionRepo.find({ where: { id_user: idUser } });
        return this.sendMany(subscriptions, payload);
    }

    /** Aviso de pausa programada para los trabajadores activos del área del cronograma. */
    async notifyPausaDue(event: PausaDueEvent): Promise<number> {
        if (!isPushEnabled()) return 0;

        const subscriptions = await this.subscriptionRepo
            .createQueryBuilder("s")
            .innerJoin("s.user", "u")
            .where("u.id_area = :idArea", { idArea: event.idArea })
            .andWhere("u.status_user = 1")
            .getMany();
        if (subscriptions.length === 0) return 0;

        const routine = event.idRoutine
            ? await this.routineRepo.findOne({ where: { id_routine: event.idRoutine } })
            : null;
        const time = formatTimeInTz(new Date(event.scheduledAt), envs.APP_TIMEZONE);
        const routineLabel = routine?.name_routine ?? "tu rutina guiada";

        return this.sendMany(subscriptions, {
            type: "pausa-due",
            title: "¡Es hora de tu pausa activa!",
            body: `${routineLabel} · ${time}. Tómate unos minutos para moverte y respirar.`,
            url: "/app/pausas",
            tag: `pausa-${event.idSchedule}-${event.scheduledAt}`,
            data: {
                idEvent: event.idEvent,
                idRoutine: event.idRoutine,
                routineName: routine?.name_routine ?? null,
                scheduledAt: event.scheduledAt,
            },
        });
    }

    private async sendMany(subscriptions: PushSubscription[], payload: PushPayload): Promise<number> {
        if (!isPushEnabled() || subscriptions.length === 0) return 0;
        const body = JSON.stringify(payload);

        const results = await Promise.all(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        body,
                        { TTL: 60 * 30, urgency: "high" }
                    );
                    return true;
                } catch (error) {
                    // 404/410: el navegador revocó la suscripción, ya no sirve guardarla.
                    if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
                        await this.subscriptionRepo.delete({ id_subscription: sub.id_subscription });
                    } else {
                        console.error("[push] error al enviar notificación:", error);
                    }
                    return false;
                }
            })
        );
        return results.filter(Boolean).length;
    }
}
