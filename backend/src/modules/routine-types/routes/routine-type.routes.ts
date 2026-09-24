import { Router } from "express";
import { RoutineTypeRepository } from "../repository/routine-type.repository";
import { RoutineTypeService } from "../service/routine-type.service";
import { RoutineTypeController } from "../controller/routine-type.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../../config/permissions";

const router = Router();

const routineTypeRepository = new RoutineTypeRepository();
const routineTypeService = new RoutineTypeService(routineTypeRepository);
const routineTypeController = new RoutineTypeController(routineTypeService);

router.get("/", authenticateToken, requirePermission(PERMISSIONS.routineTypes.read), (req, res) =>
    routineTypeController.getAllTypes(req, res)
);
router.post("/", authenticateToken, requirePermission(PERMISSIONS.routineTypes.create), (req, res) =>
    routineTypeController.createType(req, res)
);
router.get("/:id", authenticateToken, requirePermission(PERMISSIONS.routineTypes.read), (req, res) =>
    routineTypeController.getTypeById(req, res)
);
router.put("/:id", authenticateToken, requirePermission(PERMISSIONS.routineTypes.update), (req, res) =>
    routineTypeController.updateType(req, res)
);
router.delete("/:id", authenticateToken, requirePermission(PERMISSIONS.routineTypes.delete), (req, res) =>
    routineTypeController.deleteType(req, res)
);

export default router;