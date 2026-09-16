import { Router } from "express";
import { UserRepository } from "../repository/user.repository";
import { AuthService } from "../service/auth.service";
import { UserService } from "../service/user.service";
import { AuthController } from "../controller/auth.controller";
import { authenticateToken } from "../../../middlewares/auth.middleware";

const router = Router();

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const userService = new UserService(userRepository);
const authController = new AuthController(authService, userService);

router.post("/login", (req, res) => authController.login(req, res));

router.post("/users", (req, res) => authController.createUser(req, res));
router.get("/users", authenticateToken, (req, res) => authController.getAllUsers(req, res));
router.get("/users/email/:email", authenticateToken, (req, res) => authController.getUserByEmail(req, res));
router.get("/users/:id", authenticateToken, (req, res) => authController.getUserById(req, res));
router.put("/users/:id", authenticateToken, (req, res) => authController.updateUser(req, res));
router.delete("/users/:id", authenticateToken, (req, res) => authController.deleteUser(req, res));

export default router;