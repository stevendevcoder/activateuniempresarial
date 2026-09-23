import { Router } from "express";
import { UserRepository } from "../repository/user.repository";
import { RoleRepository } from "../../roles/repository/role.repository";
import { AreaRepository } from "../../areas/repository/area.repository";
import { AuthService } from "../service/auth.service";
import { UserService } from "../service/user.service";
import { AuthController } from "../controller/auth.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";
import { requirePermission } from "../../../middlewares/rbac.middleware";
import { loginLimiter } from "../../../middlewares/rate-limit.middleware";
import { PERMISSIONS } from "../../../config/permissions";

const router = Router();

const userRepository = new UserRepository();
const roleRepository = new RoleRepository();
const areaRepository = new AreaRepository();
const authService = new AuthService(userRepository, roleRepository);
const userService = new UserService(userRepository, roleRepository, areaRepository);
const authController = new AuthController(authService, userService);

router.post("/login", loginLimiter, (req, res) => authController.login(req, res));

router.get("/me", authenticateToken, (req, res) => authController.getMe(req, res));

router.post("/users", authenticateToken, requirePermission(PERMISSIONS.users.create), (req, res) =>
    authController.createUser(req, res)
);
router.get("/users", authenticateToken, requirePermission(PERMISSIONS.users.read), (req, res) =>
    authController.getAllUsers(req, res)
);
router.get("/users/email/:email", authenticateToken, requirePermission(PERMISSIONS.users.read), (req, res) =>
    authController.getUserByEmail(req, res)
);
router.get("/users/:id", authenticateToken, requirePermission(PERMISSIONS.users.read), (req, res) =>
    authController.getUserById(req, res)
);
router.put("/users/:id", authenticateToken, requirePermission(PERMISSIONS.users.update), (req, res) =>
    authController.updateUser(req, res)
);
router.delete("/users/:id", authenticateToken, requirePermission(PERMISSIONS.users.delete), (req, res) =>
    authController.deleteUser(req, res)
);

export default router;