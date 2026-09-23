import { Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import { User } from "./user.entity";

export interface UserRecord {
    id: number;
    name: string;
    email: string;
    password: string;
    status: number;
}

export type PublicUser = Omit<UserRecord, "password">;

export interface IUserRepository {
    create(user: Omit<UserRecord, "id">): Promise<number>;
    update(id: number, user: Partial<UserRecord>): Promise<boolean>;
    delete(id: number): Promise<boolean>;
    findById(id: number): Promise<UserRecord | null>;
    findByEmail(email: string): Promise<UserRecord | null>;
    findAllActive(): Promise<UserRecord[]>;
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
        };
    }

    private toEntity(user: Omit<UserRecord, "id">): User {
        const entity = new User();
        entity.name_user = user.name;
        entity.email_user = user.email;
        entity.password_user = user.password;
        entity.status_user = user.status;
        return entity;
    }

    async create(user: Omit<UserRecord, "id">): Promise<number> {
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
        const user = await this.repo.findOne({ where: { id_user: id } });
        return user ? this.toRecord(user) : null;
    }

    async findByEmail(email: string): Promise<UserRecord | null> {
        const user = await this.repo.findOne({ where: { email_user: email } });
        return user ? this.toRecord(user) : null;
    }

    async findAllActive(): Promise<UserRecord[]> {
        const users = await this.repo.find({ where: { status_user: 1 } });
        return users.map((u) => this.toRecord(u));
    }
}