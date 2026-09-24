import { Router } from "express";
import { ConsentRepository } from "../repository/consent.repository";
import { PrivacyRepository } from "../repository/privacy.repository";
import { ConfigRepository } from "../../config/repository/config.repository";
import { ConfigService } from "../../config/service/config.service";
import { PrivacyService } from "../service/privacy.service";
import { PrivacyController } from "../controller/privacy.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";

const router = Router();

const consentRepository = new ConsentRepository();
const privacyRepository = new PrivacyRepository();
const configService = new ConfigService(new ConfigRepository());
const privacyService = new PrivacyService(consentRepository, privacyRepository, configService);
const privacyController = new PrivacyController(privacyService);

router.get("/me/consent", authenticateToken, (req, res) => privacyController.getConsentStatus(req, res));
router.post("/me/consent", authenticateToken, (req, res) => privacyController.acceptConsent(req, res));
router.delete("/me/consent", authenticateToken, (req, res) => privacyController.revokeConsent(req, res));
router.post("/me/data-deletion", authenticateToken, (req, res) => privacyController.requestDeletion(req, res));

export default router;
