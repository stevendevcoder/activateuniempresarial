import { Router } from "express";
import { RoutineRepository } from "../persistence/routine.repository";
import { RoutineTypeRepository } from "../../../routine-types/infrastructure/persistence/routine-type.repository";
import { VideoRepository } from "../../../media/infrastructure/persistence/video.repository";
import { RoutineService } from "../../application/routine.service";
import { RoutineController } from "./routine.controller";
import { authenticateToken } from "../../../../middlewares/auth.middleware";
import { requirePermission } from "../../../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../../../config/permissions";

const router = Router();

const routineRepository = new RoutineRepository();
const routineTypeRepository = new RoutineTypeRepository();
const videoRepository = new VideoRepository();
const routineService = new RoutineService(routineRepository, routineTypeRepository, videoRepository);
const routineController = new RoutineController(routineService);

router.get("/", authenticateToken, requirePermission(PERMISSIONS.routines.read), (req, res) =>
    routineController.getAllRoutines(req, res)
);
router.post("/", authenticateToken, requirePermission(PERMISSIONS.routines.create), (req, res) =>
    routineController.createRoutine(req, res)
);
router.get("/:id", authenticateToken, requirePermission(PERMISSIONS.routines.read), (req, res) =>
    routineController.getRoutineById(req, res)
);
router.put("/:id", authenticateToken, requirePermission(PERMISSIONS.routines.update), (req, res) =>
    routineController.updateRoutine(req, res)
);
router.put("/:id/status", authenticateToken, requirePermission(PERMISSIONS.routines.update), (req, res) =>
    routineController.setStatus(req, res)
);
router.delete("/:id", authenticateToken, requirePermission(PERMISSIONS.routines.delete), (req, res) =>
    routineController.deleteRoutine(req, res)
);

export default router;
