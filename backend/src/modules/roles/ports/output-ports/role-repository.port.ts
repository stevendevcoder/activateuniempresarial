export interface RoleRecord {
    id: number;
    name: string;
    description: string | null;
    status: number;
}

export type RoleInput = Omit<RoleRecord, "id">;

export interface IRoleRepository {
    create(role: RoleInput): Promise<number>;
    update(id: number, role: Partial<RoleInput>): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    findById(id: number): Promise<RoleRecord | null>;
    findByName(name: string): Promise<RoleRecord | null>;
    findAll(): Promise<RoleRecord[]>;
    findPermissionNamesByRole(roleId: number): Promise<string[]>;
}
