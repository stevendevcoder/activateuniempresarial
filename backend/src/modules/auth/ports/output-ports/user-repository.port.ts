export interface UserRecord {
    id: number;
    name: string;
    email: string;
    password: string;
    status: number;
    idRole: number | null;
    roleName: string | null;
    idArea: number | null;
    areaName: string | null;
    photo: string | null;
}

export type UserInput = Omit<UserRecord, "id">;

export type PublicUser = Omit<UserRecord, "password">;

export function toPublicUser(user: UserRecord): PublicUser {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        idRole: user.idRole,
        roleName: user.roleName,
        idArea: user.idArea,
        areaName: user.areaName,
        photo: user.photo,
    };
}

export interface UserFilters {
    name?: string;
    area?: number;
    status?: number;
}

export interface IUserRepository {
    create(user: UserInput): Promise<number>;
    update(id: number, user: Partial<UserRecord>): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    findById(id: number): Promise<UserRecord | null>;
    findByEmail(email: string): Promise<UserRecord | null>;
    findAll(filters?: UserFilters): Promise<UserRecord[]>;
    findAllActive(): Promise<UserRecord[]>;
    countByArea(areaId: number): Promise<number>;
}
