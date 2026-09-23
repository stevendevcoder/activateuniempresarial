import { Request, Response } from "express";
import { AuthService } from "../service/auth.service";
import { UserService } from "../service/user.service";
import { PublicUser, UserRecord } from "../repository/user.repository";
import { loadUserData } from "../validation/user.validation";
import { loadUpdateUserData } from "../validation/user-update.validation";
import { loadEmail } from "../validation/email.validation";

export class AuthController {
    private authService: AuthService;
    private userService: UserService;

    constructor(authService: AuthService, userService: UserService) {
        this.authService = authService;
        this.userService = userService;
    }

    private toPublicUser(user: UserRecord): PublicUser {
        const { password: _password, ...publicUser } = user;
        return publicUser;
    }

    async login(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: "Email y contraseña requeridos" });
            }
            const token = await this.authService.login(email, password);
            return res.status(200).json({ message: "Login éxito", token });
        } catch (error) {
            if (error instanceof Error && error.message === "Credenciales Inválidas") {
                return res.status(401).json({ error: "Credenciales Inválidas" });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async createUser(req: Request, res: Response): Promise<Response> {
        try {
            const { name, email, password, status } = loadUserData(req.body);
            const user: Omit<UserRecord, "id"> = { name, email, password, status };
            const userId = await this.userService.createUser(user);
            return res.status(201).json({ message: "Usuario creado con éxito", userId });
        } catch (error) {
            if (error instanceof Error && error.message === "Este email ya está registrado") {
                return res.status(409).json({ error: error.message });
            }
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async updateUser(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const data = loadUpdateUserData(req.body);
            const updated = await this.userService.updateUser(id, data);

            if (!updated) {
                return res.status(404).json({ error: "Usuario no encontrado o sin cambios" });
            }
            return res.status(200).json({ message: "Usuario actualizado con éxito" });
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                if (message === "Usuario no encontrado") {
                    return res.status(404).json({ error: message });
                }
                if (message === "El email ya está en uso") {
                    return res.status(409).json({ error: message });
                }
                return res.status(400).json({ error: message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getUserById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const user = await this.userService.getUserById(id);
            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            return res.status(200).json(this.toPublicUser(user));
        } catch (error) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getUserByEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { email } = loadEmail(req.params);
            const user = await this.userService.getUserByEmail(email);
            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            return res.status(200).json(this.toPublicUser(user));
        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getAllUsers(req: Request, res: Response): Promise<Response> {
        try {
            const users = await this.userService.getAllUsers();
            return res.status(200).json(users.map((user) => this.toPublicUser(user)));
        } catch (error) {
            return res.status(500).json({ message: "Error al obtener usuarios" });
        }
    }

    async deleteUser(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const deleted = await this.userService.deleteUser(id);
            if (!deleted) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            return res.status(200).json({ message: "Usuario eliminado con éxito" });
        } catch (error) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}