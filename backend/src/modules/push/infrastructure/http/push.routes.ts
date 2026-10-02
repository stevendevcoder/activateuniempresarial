import { Router } from "express";
import { authenticateToken } from "../../../../middlewares/auth.middleware";
import { PushService } from "../../application/push.service";
import { PushController } from "./push.controller";

const router = Router();

const pushController = new PushController(new PushService());

router.get("/public-key", authenticateToken, (req, res) => pushController.getPublicKey(req, res));
router.post("/subscriptions", authenticateToken, (req, res) => pushController.subscribe(req, res));
router.delete("/subscriptions", authenticateToken, (req, res) => pushController.unsubscribe(req, res));
router.post("/test", authenticateToken, (req, res) => pushController.sendTest(req, res));

export default router;
