import http from "http";
import app from "./app";
import envs from "./config/environment-vars";
import { connectDB, AppDataSource } from "./config/data-base";
import { bootstrapData } from "./config/bootstrap";
import { ScheduleRepository } from "./modules/schedules/infrastructure/persistence/schedule.repository";
import { ConfigRepository } from "./modules/config/infrastructure/persistence/config.repository";
import { ConfigService } from "./modules/config/application/config.service";
import { SchedulerService } from "./modules/schedules/application/scheduler.service";
import { PushService, isPushEnabled } from "./modules/push/application/push.service";
import { PAUSA_DUE, PausaDueEvent, schedulerEvents } from "./events/scheduler.events";

const PORT = Number(envs.PORT);

(async (): Promise<void> => {
    try {
        await connectDB();
        await bootstrapData();

        const scheduler = new SchedulerService(
            new ScheduleRepository(),
            new ConfigService(new ConfigRepository())
        );
        if (envs.SCHEDULER_ENABLED) {
            scheduler.start();
        }

        // Cada pausa que emite el motor se avisa por Web Push a los trabajadores del área.
        if (isPushEnabled()) {
            const push = new PushService();
            schedulerEvents.on(PAUSA_DUE, (event: PausaDueEvent) => {
                push.notifyPausaDue(event).catch((error) => console.error("[push] error al notificar pausa:", error));
            });
        } else {
            console.warn("[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY no configuradas: notificaciones push desactivadas");
        }

        const server = http.createServer(app);
        server.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

        const shutdown = async (signal: string) => {
            console.log(`\n${signal} received — shutting down gracefully`);
            scheduler.stop();
            server.close(async () => {
                await AppDataSource.destroy();
                process.exit(0);
            });
            setTimeout(() => process.exit(1), 10000);
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    } catch (error) {
        console.log("Error al iniciar la aplicación", error);
        process.exit(1);
    }
})();
