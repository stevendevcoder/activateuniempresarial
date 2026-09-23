import { Router } from "express";
import { TelemetryRepository } from "../repository/telemetry.repository";
import { PausaRepository } from "../../pausas/repository/pausa.repository";
import { ConfigRepository } from "../../config/repository/config.repository";
import { ConfigService } from "../../config/service/config.service";
import { TelemetryService } from "../service/telemetry.service";
import { TelemetryController } from "../controller/telemetry.controller";
import { ConsentRepository } from "../../privacy/repository/consent.repository";
import { authenticateToken } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../../config/permissions";

const router = Router();

const telemetryRepository = new TelemetryRepository();
const pausaRepository = new PausaRepository();
const configService = new ConfigService(new ConfigRepository());
const consentRepository = new ConsentRepository();
const telemetryService = new TelemetryService(
    telemetryRepository,
    pausaRepository,
    configService,
    consentRepository
);
const telemetryController = new TelemetryController(telemetryService);

router.post("/events", authenticateToken, requirePermission(PERMISSIONS.telemetry.create), (req, res) =>
    telemetryController.ingest(req, res)
);
router.post("/events/batch", authenticateToken, requirePermission(PERMISSIONS.telemetry.create), (req, res) =>
    telemetryController.ingestBatch(req, res)
);
router.get("/events/me", authenticateToken, (req, res) => telemetryController.listMine(req, res));
router.get("/events", authenticateToken, requirePermission(PERMISSIONS.telemetry.read), (req, res) =>
    telemetryController.list(req, res)
);
router.get("/summary", authenticateToken, requirePermission(PERMISSIONS.telemetry.read), (req, res) =>
    telemetryController.summary(req, res)
);

export default router;
