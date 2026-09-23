import { Request, Response } from "express";
import { RolesService } from "../service/roles.service";
import { loadRoleData } from "../validation/role.validation";
import { loadRoleUpdateData } from "../validation/role-update.validation";
import { loadPermissionIdsData } from "../validation/role-permission.validation";

export class RolesController {
    private rolesService: RolesService;

    constructor(rolesService: RolesService) {
        this.rolesService = rolesService;
    }

    async createRole(req: Request, res: Response): Promise<Response> {
        try {
            const { name, description, status } = loadRoleData(req.body);
            const roleId = await this.rolesService.createRole({ name, description, status });
            return res.status(201).json({ message: "Rol creado con éxito", roleId });
        } catch (error) {
            if (error instanceof Error && error.message === "Ya existe un rol con ese nombre") {
                return res.status(409).json({ error: error.message });
            }
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async updateRole(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const data = loadRoleUpdateData(req.body);
            const updated = await this.rolesService.updateRole(id, data);

            if (!updated) {
                return res.status(404).json({ error: "Rol no encontrado o sin cambios" });
            }
            return res.status(200).json({ message: "Rol actualizado con éxito" });
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                if (message === "Rol no encontrado") {
                    return res.status(404).json({ error: message });
                }
                if (message === "Ya existe otro rol con ese nombre") {
                    return res.status(409).json({ error: message });
                }
                return res.status(400).json({ error: message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async deleteRole(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const deleted = await this.rolesService.deleteRole(id);
            if (!deleted) {
                return res.status(404).json({ error: "Rol no encontrado" });
            }
            return res.status(200).json({ message: "Rol eliminado con éxito" });
        } catch (error) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getRoleById(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const role = await this.rolesService.getRoleById(id);
            if (!role) {
                return res.status(404).json({ error: "Rol no encontrado" });
            }
            return res.status(200).json(role);
        } catch (error) {
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getAllRoles(req: Request, res: Response): Promise<Response> {
        try {
            const roles = await this.rolesService.getAllRoles();
            return res.status(200).json(roles);
        } catch (error) {
            return res.status(500).json({ error: "Error al obtener roles" });
        }
    }

    async getPermissionsByRole(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const permissions = await this.rolesService.getPermissionsByRole(id);
            return res.status(200).json(permissions);
        } catch (error) {
            if (error instanceof Error && error.message === "Rol no encontrado") {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async assignPermissions(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                return res.status(400).json({ error: "ID inválido" });
            }

            const { permissionIds } = loadPermissionIdsData(req.body);
            const assigned = await this.rolesService.assignPermissions(id, permissionIds);

            if (!assigned) {
                return res.status(404).json({ error: "Rol no encontrado" });
            }
            return res.status(200).json({ message: "Permisos asignados con éxito" });
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                if (message === "Rol no encontrado") {
                    return res.status(404).json({ error: message });
                }
                if (message.includes("permisos no existen")) {
                    return res.status(400).json({ error: message });
                }
                return res.status(400).json({ error: message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getAllPermissions(req: Request, res: Response): Promise<Response> {
        try {
            const permissions = await this.rolesService.getAllPermissions();
            return res.status(200).json(permissions);
        } catch (error) {
            return res.status(500).json({ error: "Error al obtener permisos" });
        }
    }
}