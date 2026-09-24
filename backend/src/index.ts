import http from "http";
import app from "./app";
import envs from "./config/environment-vars";
import { connectDB, AppDataSource } from "./config/data-base";
import { bootstrapData } from "./config/bootstrap";
import { ScheduleRepository } from "./modules/schedules/repository/schedule.repository";
import { ConfigRepository } from "./modules/config/repository/config.repository";
import { ConfigService } from "./modules/config/service/config.service";
import { SchedulerService } from "./modules/schedules/service/scheduler.service";

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
