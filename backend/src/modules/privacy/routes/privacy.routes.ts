import { Router } from "express";
import { ConsentRepository } from "../repository/consent.repository";
import { PrivacyRepository } from "../repository/privacy.repository";
import { ConfigRepository } from "../../config/repository/config.repository";
import { ConfigService } from "../../config/service/config.service";
import { PrivacyService } from "../service/privacy.service";
import { PrivacyController } from "../controller/privacy.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../../config/permissions";

const router = Router();

const consentRepository = new ConsentRepository();
const privacyRepository = new PrivacyRepository();
const configService = new ConfigService(new ConfigRepository());
const privacyService = new PrivacyService(consentRepository, privacyRepository, configService);
const privacyController = new PrivacyController(privacyService);

router.get("/consents", authenticateToken, requirePermission(PERMISSIONS.privacy.read), (req, res) =>
    privacyController.listConsents(req, res)
);
router.get("/retention/preview", authenticateToken, requirePermission(PERMISSIONS.privacy.read), (req, res) =>
    privacyController.retentionPreview(req, res)
);
router.post("/retention/run", authenticateToken, requirePermission(PERMISSIONS.privacy.manage), (req, res) =>
    privacyController.runRetention(req, res)
);

export default router;
