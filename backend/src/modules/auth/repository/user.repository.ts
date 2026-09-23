import { Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { User } from "./user.entity";

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

export class UserRepository implements IUserRepository {
    private repo: Repository<User>;

    constructor() {
        this.repo = AppDataSource.getRepository(User);
    }

    private toRecord(user: User): UserRecord {
        return {
            id: user.id_user,
            name: user.name_user,
            email: user.email_user,
            password: user.password_user,
            status: user.status_user,
            idRole: user.id_role,
            roleName: user.role?.name_role ?? null,
            idArea: user.id_area,
            areaName: user.area?.name_area ?? null,
            photo: user.photo_user ?? null,
        };
    }

    private toEntity(user: UserInput): User {
        const entity = new User();
        entity.name_user = user.name;
        entity.email_user = user.email;
        entity.password_user = user.password;
        entity.status_user = user.status;
        entity.id_role = user.idRole;
        entity.id_area = user.idArea;
        entity.photo_user = user.photo;
        return entity;
    }

    async create(user: UserInput): Promise<number> {
        const saved = await this.repo.save(this.toEntity(user));
        return saved.id_user;
    }

    async update(id: number, user: Partial<UserRecord>): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_user: id } });
        if (!existing) return false;

        Object.assign(existing, {
            name_user: user.name ?? existing.name_user,
            email_user: user.email ?? existing.email_user,
            password_user: user.password ?? existing.password_user,
            status_user: user.status ?? existing.status_user,
        });
        if (user.idRole !== undefined) {
            existing.id_role = user.idRole;
        }
        if (user.idArea !== undefined) {
            existing.id_area = user.idArea;
        }
        if (user.photo !== undefined) {
            existing.photo_user = user.photo;
        }

        await this.repo.save(existing);
        return true;
    }

    async delete(id: number): Promise<boolean> {
        const existing = await this.repo.findOne({ where: { id_user: id } });
        if (!existing) return false;

        existing.status_user = 0;
        await this.repo.save(existing);
        return true;
    }

    async findById(id: number): Promise<UserRecord | null> {
        const user = await this.repo.findOne({
            where: { id_user: id },
            relations: { role: true, area: true },
        });
        return user ? this.toRecord(user) : null;
    }

    async findByEmail(email: string): Promise<UserRecord | null> {
        const user = await this.repo.findOne({
            where: { email_user: email },
            relations: { role: true, area: true },
        });
        return user ? this.toRecord(user) : null;
    }

    async findAll(filters: UserFilters = {}): Promise<UserRecord[]> {
        const query = this.repo
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.role", "role")
            .leftJoinAndSelect("user.area", "area");

        if (filters.name) {
            query.andWhere("user.name_user ILIKE :name", { name: `%${filters.name}%` });
        }
        if (filters.area !== undefined) {
            query.andWhere("user.id_area = :area", { area: filters.area });
        }
        if (filters.status !== undefined) {
            query.andWhere("user.status_user = :status", { status: filters.status });
        }

        query.orderBy("user.name_user", "ASC");

        const users = await query.getMany();
        return users.map((u) => this.toRecord(u));
    }

    async findAllActive(): Promise<UserRecord[]> {
        const users = await this.repo.find({
            where: { status_user: 1 },
            relations: { role: true, area: true },
        });
        return users.map((u) => this.toRecord(u));
    }

    async countByArea(areaId: number): Promise<number> {
        return this.repo.count({
            where: { id_area: areaId, status_user: 1 },
        });
    }
}