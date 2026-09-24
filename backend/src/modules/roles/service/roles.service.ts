import { IRoleRepository, PermissionRecord, RoleRecord, RoleInput } from "../repository/role.repository";
import { IPermissionRepository } from "../repository/permission.repository";

export class RolesService {
    private roleRepo: IRoleRepository;
    private permissionRepo: IPermissionRepository;

    constructor(roleRepo: IRoleRepository, permissionRepo: IPermissionRepository) {
        this.roleRepo = roleRepo;
        this.permissionRepo = permissionRepo;
    }

    async createRole(role: RoleInput): Promise<number> {
        const existing = await this.roleRepo.findByName(role.name);
        if (existing) {
            throw new Error("Ya existe un rol con ese nombre");
        }
        return this.roleRepo.create(role);
    }

    async updateRole(id: number, role: Partial<RoleInput>): Promise<boolean> {
        const existing = await this.roleRepo.findById(id);
        if (!existing) {
            throw new Error("Rol no encontrado");
        }
        if (role.name) {
            const nameTaken = await this.roleRepo.findByName(role.name);
            if (nameTaken && nameTaken.id !== id) {
                throw new Error("Ya existe otro rol con ese nombre");
            }
        }
        return this.roleRepo.update(id, role);
    }

    async deleteRole(id: number): Promise<boolean> {
        const existing = await this.roleRepo.findById(id);
        if (!existing) {
            throw new Error("Rol no encontrado");
        }
        return this.roleRepo.delete(id);
    }

    async getRoleById(id: number): Promise<RoleRecord | null> {
        return this.roleRepo.findById(id);
    }

    async getRoleByName(name: string): Promise<RoleRecord | null> {
        return this.roleRepo.findByName(name);
    }

    async getAllRoles(): Promise<RoleRecord[]> {
        return this.roleRepo.findAll();
    }

    async getPermissionsByRole(roleId: number): Promise<PermissionRecord[]> {
        const role = await this.roleRepo.findById(roleId);
        if (!role) {
            throw new Error("Rol no encontrado");
        }
        return role.permissions;
    }

    async assignPermissions(roleId: number, permissionIds: number[]): Promise<boolean> {
        const role = await this.roleRepo.findById(roleId);
        if (!role) {
            throw new Error("Rol no encontrado");
        }

        const allExist = await this.permissionRepo.existsByIds(permissionIds);
        if (!allExist) {
            throw new Error("Uno o más permisos no existen");
        }

        const assigned = await this.roleRepo.assignPermissions(roleId, permissionIds);
        return assigned;
    }

    async getAllPermissions(): Promise<PermissionRecord[]> {
        return this.permissionRepo.findAll();
    }
}