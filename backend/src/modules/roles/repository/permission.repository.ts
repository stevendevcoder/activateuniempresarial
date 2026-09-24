import { In, Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { Permission } from "./permission.entity";
import { PermissionRecord } from "./role.repository";

export interface IPermissionRepository {
    findAll(): Promise<PermissionRecord[]>;
    findByIds(ids: number[]): Promise<Permission[]>;
    existsByIds(ids: number[]): Promise<boolean>;
}

export class PermissionRepository implements IPermissionRepository {
    private repo: Repository<Permission>;

    constructor() {
        this.repo = AppDataSource.getRepository(Permission);
    }

    private toRecord(permission: Permission): PermissionRecord {
        return {
            id: permission.id_permission,
            name: permission.name_permission,
            module: permission.module_permission,
            description: permission.description_permission,
        };
    }

    async findAll(): Promise<PermissionRecord[]> {
        const permissions = await this.repo.find({
            order: { module_permission: "ASC", name_permission: "ASC" },
        });
        return permissions.map((p) => this.toRecord(p));
    }

    async findByIds(ids: number[]): Promise<Permission[]> {
        return this.repo.findBy({ id_permission: In(ids) });
    }

    async existsByIds(ids: number[]): Promise<boolean> {
        const permissions = await this.repo.findBy({ id_permission: In(ids) });
        return permissions.length === new Set(ids).size;
    }
}