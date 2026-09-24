import { Router } from "express";
import { PausaRepository } from "../../pausas/repository/pausa.repository";
import { AnalyticsService } from "../service/analytics.service";
import { AnalyticsController } from "../controller/analytics.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../../config/permissions";

const router = Router();

const pausaRepository = new PausaRepository();
const analyticsService = new AnalyticsService(pausaRepository);
const analyticsController = new AnalyticsController(analyticsService);

router.get("/summary", authenticateToken, requirePermission(PERMISSIONS.analytics.read), (req, res) =>
    analyticsController.getSummary(req, res)
);
router.get("/timeline", authenticateToken, requirePermission(PERMISSIONS.analytics.read), (req, res) =>
    analyticsController.getTimeline(req, res)
);
router.get("/areas", authenticateToken, requirePermission(PERMISSIONS.analytics.read), (req, res) =>
    analyticsController.getAreas(req, res)
);
router.get("/users", authenticateToken, requirePermission(PERMISSIONS.analytics.read), (req, res) =>
    analyticsController.getUsers(req, res)
);
router.get("/export/pdf", authenticateToken, requirePermission(PERMISSIONS.analytics.export), (req, res) =>
    analyticsController.exportPdf(req, res)
);
router.get("/export/xlsx", authenticateToken, requirePermission(PERMISSIONS.analytics.export), (req, res) =>
    analyticsController.exportExcel(req, res)
);

export default router;