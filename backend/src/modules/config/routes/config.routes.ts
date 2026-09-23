import { Router } from "express";
import { ConfigRepository } from "../repository/config.repository";
import { ConfigService } from "../service/config.service";
import { ConfigController } from "../controller/config.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../../config/permissions";

const router = Router();

const configRepository = new ConfigRepository();
const configService = new ConfigService(configRepository);
const configController = new ConfigController(configService);

router.get("/", authenticateToken, requirePermission(PERMISSIONS.config.read), (req, res) =>
    configController.getConfig(req, res)
);
router.put("/", authenticateToken, requirePermission(PERMISSIONS.config.update), (req, res) =>
    configController.updateConfig(req, res)
);

router.get("/holidays", authenticateToken, requirePermission(PERMISSIONS.config.read), (req, res) =>
    configController.listHolidays(req, res)
);
router.post("/holidays", authenticateToken, requirePermission(PERMISSIONS.config.update), (req, res) =>
    configController.createHoliday(req, res)
);
router.delete("/holidays/:id", authenticateToken, requirePermission(PERMISSIONS.config.update), (req, res) =>
    configController.deleteHoliday(req, res)
);

export default router;
