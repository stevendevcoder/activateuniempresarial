import { Router } from "express";
import { PausaRepository } from "../../../pausas/infrastructure/persistence/pausa.repository";
import { UserRepository } from "../../../auth/infrastructure/persistence/user.repository";
import { RoutineRepository } from "../../../routines/infrastructure/persistence/routine.repository";
import { PortalService } from "../../application/portal.service";
import { PortalController } from "./portal.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";
import { uploadAvatarMiddleware } from "./middlewares/upload-avatar.middleware";

const router = Router();

const pausaRepository = new PausaRepository();
const userRepository = new UserRepository();
const routineRepository = new RoutineRepository();
const portalService = new PortalService(pausaRepository, userRepository, routineRepository);
const portalController = new PortalController(portalService);

router.get("/me/pauses", authenticateToken, (req, res) => portalController.getHistory(req, res));
router.get("/me/stats", authenticateToken, (req, res) => portalController.getStats(req, res));
router.get("/me/streak", authenticateToken, (req, res) => portalController.getStreak(req, res));
router.post("/me/pauses", authenticateToken, (req, res) => portalController.registerPause(req, res));
router.put("/me/pauses/:id/status", authenticateToken, (req, res) => portalController.updatePauseStatus(req, res));
router.put("/me/profile", authenticateToken, (req, res) => portalController.updateProfile(req, res));
router.post("/me/profile/photo", authenticateToken, uploadAvatarMiddleware, (req, res) =>
    portalController.uploadPhoto(req, res)
);

export default router;