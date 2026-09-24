import express, { type Request, type Response } from "express";
import cors from "cors";
import envs from "./config/environment-vars";
import { AppDataSource } from "./config/data-base";
import { ensureUploadDir, ensureAvatarUploadDir, AVATAR_UPLOAD_DIR } from "./config/media";
import { globalLimiter } from "./middlewares/rate-limit.middleware";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./modules/auth/routes/auth.routes";
import rolesRoutes from "./modules/roles/routes/roles.routes";
import areasRoutes from "./modules/areas/routes/areas.routes";
import mediaRoutes from "./modules/media/routes/media.routes";
import routineTypeRoutes from "./modules/routine-types/routes/routine-type.routes";
import routineRoutes from "./modules/routines/routes/routine.routes";
import analyticsRoutes from "./modules/analytics/routes/analytics.routes";
import portalRoutes from "./modules/portal/routes/portal.routes";
import configRoutes from "./modules/config/routes/config.routes";
import scheduleRoutes from "./modules/schedules/routes/schedule.routes";
import telemetryRoutes from "./modules/telemetry/routes/telemetry.routes";
import privacyRoutes from "./modules/privacy/routes/privacy.routes";
import mePrivacyRoutes from "./modules/privacy/routes/me-privacy.routes";

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
