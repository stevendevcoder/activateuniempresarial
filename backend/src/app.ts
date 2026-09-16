import express, { type Request, type Response } from "express";
import cors from "cors";
import envs from "./config/environment-vars";
import authRoutes from "./modules/auth/routes/auth.routes";

class App {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.middlewares();
        this.routes();
    }

    private middlewares(): void {
        this.app.use(cors({ origin: envs.CORS_ORIGIN.split(",").map((o) => o.trim()) }));
        this.app.use(express.json());
    }

    private routes(): void {
        this.app.get("/api/health", (_req: Request, res: Response) => {
            res.status(200).json({ status: "ok" });
        });
        this.app.use("/api", authRoutes);
    }

    getApp() {
        return this.app;
    }
}

export default new App().getApp();