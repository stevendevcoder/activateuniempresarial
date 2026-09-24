import { Router } from "express";
import { RoleRepository } from "../repository/role.repository";
import { PermissionRepository } from "../repository/permission.repository";
import { RolesService } from "../service/roles.service";
import { RolesController } from "../controller/roles.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/rbac.middleware";
import { PERMISSIONS } from "../../../config/permissions";

const router = Router();

const roleRepository = new RoleRepository();
const permissionRepository = new PermissionRepository();
const rolesService = new RolesService(roleRepository, permissionRepository);
const rolesController = new RolesController(rolesService);

router.get("/permissions", authenticateToken, requirePermission(PERMISSIONS.roles.read), (req, res) =>
    rolesController.getAllPermissions(req, res)
);

router.get("/", authenticateToken, requirePermission(PERMISSIONS.roles.read), (req, res) =>
    rolesController.getAllRoles(req, res)
);
router.post("/", authenticateToken, requirePermission(PERMISSIONS.roles.create), (req, res) =>
    rolesController.createRole(req, res)
);
router.get("/:id", authenticateToken, requirePermission(PERMISSIONS.roles.read), (req, res) =>
    rolesController.getRoleById(req, res)
);
router.put("/:id", authenticateToken, requirePermission(PERMISSIONS.roles.update), (req, res) =>
    rolesController.updateRole(req, res)
);
router.delete("/:id", authenticateToken, requirePermission(PERMISSIONS.roles.delete), (req, res) =>
    rolesController.deleteRole(req, res)
);
router.get("/:id/permissions", authenticateToken, requirePermission(PERMISSIONS.roles.read), (req, res) =>
    rolesController.getPermissionsByRole(req, res)
);
router.put("/:id/permissions", authenticateToken, requirePermission(PERMISSIONS.roles.assign), (req, res) =>
    rolesController.assignPermissions(req, res)
);

export default router;