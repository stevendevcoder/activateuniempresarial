import { In, Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { Role } from "./role.entity";
import { Permission } from "./permission.entity";

export interface PermissionRecord {
    id: number;
    name: string;
    module: string;
    description: string;
}

export interface RoleRecord {
    id: number;
    name: string;
    description: string;
    status: number;
    permissions: PermissionRecord[];
    permissionNames: string[];
}

export type RoleInput = Omit<RoleRecord, "id" | "permissions" | "permissionNames">;

export interface IRoleRepository {
    create(role: RoleInput): Promise<number>;
    update(id: number, role: Partial<RoleInput>): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    findById(id: number): Promise<RoleRecord | null>;
    findByName(name: string): Promise<RoleRecord | null>;
    findAll(): Promise<RoleRecord[]>;
    findPermissionNamesByRole(roleId: number): Promise<string[]>;
    findPermissionsByRole(roleId: number): Promise<PermissionRecord[]>;
    assignPermissions(roleId: number, permissionIds: number[]): Promise<boolean>;
}

export class RoleRepository implements IRoleRepository {
    private repo: Repository<Role>;
    private permissionRepo: Repository<Permission>;

    constructor() {
        this.repo = AppDataSource.getRepository(Role);
        this.permissionRepo = AppDataSource.getRepository(Permission);
    }

    private permissionToRecord(permission: Permission): PermissionRecord {
        return {
            id: permission.id_permission,
            name: permission.name_permission,
            module: permission.module_permission,
            description: permission.description_permission,
        };
    }

    private toRecord(role: Role): RoleRecord {
        if (!Array.isArray(role.permissions)) {
            role.permissions = [];
        }
        const permissions = role.permissions.map((p) => this.permissionToRecord(p));
        return {
            id: role.id_role,
            name: role.name_role,
            description: role.description_role,
            status: role.status_role,
            permissions,
            permissionNames: permissions.map((p) => p.name),
        };
    }

    private toEntity(role: RoleInput): Role {
        const entity = new Role();
        entity.name_role = role.name;
        entity.description_role = role.description;
        entity.status_role = role.status;
        return entity;
    }

    async create(role: RoleInput): Promise<number> {
        const saved = await this.repo.save(this.toEntity(role));
        return saved.id_role;
    }

    async update(id: number, role: Partial<RoleInput>): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_role: id } });
        if (!existing) return false;

        Object.assign(existing, {
            name_role: role.name ?? existing.name_role,
            description_role: role.description ?? existing.description_role,
            status_role: role.status ?? existing.status_role,
        });

        await this.repo.save(existing);
        return true;
    }

    async delete(id: number): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_role: id } });
        if (!existing) return false;

        existing.status_role = 0;
        await this.repo.save(existing);
        return true;
    }

    async findById(id: number): Promise<RoleRecord | null> {
        const role = await this.repo.findOne({
            where: { id_role: id },
            relations: { permissions: true },
        });
        return role ? this.toRecord(role) : null;
    }

    async findByName(name: string): Promise<RoleRecord | null> {
        const role = await this.repo.findOne({
            where: { name_role: name },
            relations: { permissions: true },
        });
        return role ? this.toRecord(role) : null;
    }

    async findAll(): Promise<RoleRecord[]> {
        const roles = await this.repo.find({ relations: { permissions: true } });
        return roles.map((r) => this.toRecord(r));
    }

    async findPermissionNamesByRole(roleId: number): Promise<string[]> {
        const role = await this.repo.findOne({
            where: { id_role: roleId },
            relations: { permissions: true },
        });
        if (!role) return [];
        return role.permissions.map((p) => p.name_permission);
    }

    async findPermissionsByRole(roleId: number): Promise<PermissionRecord[]> {
        const role = await this.repo.findOne({
            where: { id_role: roleId },
            relations: { permissions: true },
        });
        if (!role) return [];
        return role.permissions.map((p) => this.permissionToRecord(p));
    }

    async assignPermissions(roleId: number, permissionIds: number[]): Promise<boolean> {
        const role = await this.repo.findOne({
            where: { id_role: roleId },
            relations: { permissions: true },
        });
        if (!role) return false;

        const permissions = await this.permissionRepo.findBy({
            id_permission: In(permissionIds),
        });
        role.permissions = permissions;
        await this.repo.save(role);
        return true;
    }
}