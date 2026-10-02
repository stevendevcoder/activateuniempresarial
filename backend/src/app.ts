import express, { type Request, type Response } from "express";
import cors from "cors";
import envs from "./config/environment-vars";
import { AppDataSource } from "./config/data-base";
import { ensureUploadDir, ensureAvatarUploadDir, AVATAR_UPLOAD_DIR } from "./config/media";
import { globalLimiter } from "./middlewares/rate-limit.middleware";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./modules/auth/infrastructure/http/auth.routes";
import rolesRoutes from "./modules/roles/infrastructure/http/roles.routes";
import areasRoutes from "./modules/areas/infrastructure/http/areas.routes";
import mediaRoutes from "./modules/media/infrastructure/http/media.routes";
import routineTypeRoutes from "./modules/routine-types/infrastructure/http/routine-type.routes";
import routineRoutes from "./modules/routines/infrastructure/http/routine.routes";
import analyticsRoutes from "./modules/analytics/infrastructure/http/analytics.routes";
import portalRoutes from "./modules/portal/infrastructure/http/portal.routes";
import configRoutes from "./modules/config/infrastructure/http/config.routes";
import scheduleRoutes from "./modules/schedules/infrastructure/http/schedule.routes";
import telemetryRoutes from "./modules/telemetry/infrastructure/http/telemetry.routes";
import privacyRoutes from "./modules/privacy/infrastructure/http/privacy.routes";
import pushRoutes from "./modules/push/infrastructure/http/push.routes";
import mePrivacyRoutes from "./modules/privacy/infrastructure/http/me-privacy.routes";

class App {
    private app: express.Application;

    constructor() {
        ensureUploadDir();
        ensureAvatarUploadDir();
        this.app = express();
        this.middlewares();
        this.routes();
        this.errorHandlers();
    }

    private middlewares(): void {
        const origins = envs.CORS_ORIGIN === "*" ? "*" : envs.CORS_ORIGIN.split(",").map((o) => o.trim());
        this.app.use(cors({ origin: origins }));
        this.app.use(express.json());
        this.app.use(globalLimiter);
        this.app.use(
            "/api/uploads/avatars",
            express.static(AVATAR_UPLOAD_DIR, {
                setHeaders(res) {
                    res.setHeader("X-Content-Type-Options", "nosniff");
                    res.setHeader("Content-Disposition", "inline");
                },
            })
        );
    }

    private routes(): void {
        this.app.get("/api/health", async (_req: Request, res: Response) => {
            try {
                await AppDataSource.query("SELECT 1");
                res.status(200).json({ status: "ok", db: "connected" });
            } catch {
                res.status(503).json({ status: "error", db: "unreachable" });
            }
        });
        this.app.use("/api", authRoutes);
        this.app.use("/api", portalRoutes);
        this.app.use("/api/roles", rolesRoutes);
        this.app.use("/api/areas", areasRoutes);
        this.app.use("/api/media", mediaRoutes);
        this.app.use("/api/routine-types", routineTypeRoutes);
        this.app.use("/api/routines", routineRoutes);
        this.app.use("/api/analytics", analyticsRoutes);
        this.app.use("/api/config", configRoutes);
        this.app.use("/api/schedules", scheduleRoutes);
        this.app.use("/api/telemetry", telemetryRoutes);
        this.app.use("/api", mePrivacyRoutes);
        this.app.use("/api/privacy", privacyRoutes);
        this.app.use("/api/push", pushRoutes);
    }

    private errorHandlers(): void {
        this.app.use(notFoundHandler);
        this.app.use(errorHandler);
    }

    getApp() {
        return this.app;
    }
}

export default new App().getApp();
