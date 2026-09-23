import { Router } from "express";
import { AreaRepository } from "../repository/area.repository";
import { UserRepository } from "../../auth/repository/user.repository";
import { AreasService } from "../service/areas.service";
import { AreasController } from "../controller/areas.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../../config/permissions";

const router = Router();

const areaRepository = new AreaRepository();
const userRepository = new UserRepository();
const areasService = new AreasService(areaRepository, userRepository);
const areasController = new AreasController(areasService);

router.get("/", authenticateToken, requirePermission(PERMISSIONS.areas.read), (req, res) =>
    areasController.getAllAreas(req, res)
);
router.post("/", authenticateToken, requirePermission(PERMISSIONS.areas.create), (req, res) =>
    areasController.createArea(req, res)
);
router.get("/:id", authenticateToken, requirePermission(PERMISSIONS.areas.read), (req, res) =>
    areasController.getAreaById(req, res)
);
router.put("/:id", authenticateToken, requirePermission(PERMISSIONS.areas.update), (req, res) =>
    areasController.updateArea(req, res)
);
router.delete("/:id", authenticateToken, requirePermission(PERMISSIONS.areas.delete), (req, res) =>
    areasController.deleteArea(req, res)
);

export default router;