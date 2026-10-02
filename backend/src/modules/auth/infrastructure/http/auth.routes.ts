import { Router } from "express";
import { UserRepository } from "../persistence/user.repository";
import { RoleRepository } from "../../../roles/infrastructure/persistence/role.repository";
import { AreaRepository } from "../../../areas/infrastructure/persistence/area.repository";
import { AuthService } from "../../application/auth.service";
import { UserService } from "../../application/user.service";
import { AuthController } from "./auth.controller";
import { authenticateToken } from "../../../../middlewares/auth.middleware";
import { requirePermission } from "../../../../middlewares/rbac.middleware";
import { forgotPasswordLimiter, loginLimiter, resetPasswordLimiter } from "../../../../middlewares/rate-limit.middleware";
import { PERMISSIONS } from "../../../../config/permissions";
import { PasswordResetService } from "../../application/password-reset.service";
import { PasswordResetController } from "./password-reset.controller";

const router = Router();

const userRepository = new UserRepository();
const roleRepository = new RoleRepository();
const areaRepository = new AreaRepository();
const authService = new AuthService(userRepository, roleRepository);
const userService = new UserService(userRepository, roleRepository, areaRepository);
const authController = new AuthController(authService, userService);
const passwordResetController = new PasswordResetController(new PasswordResetService(userRepository));

router.post("/login", loginLimiter, (req, res) => authController.login(req, res));

// Recuperación de contraseña (pública).
router.post("/password/forgot", forgotPasswordLimiter, (req, res) => passwordResetController.forgot(req, res));
router.get("/password/reset/:token", resetPasswordLimiter, (req, res) => passwordResetController.validate(req, res));
router.post("/password/reset", resetPasswordLimiter, (req, res) => passwordResetController.reset(req, res));

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
