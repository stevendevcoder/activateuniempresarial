import bcrypt from "bcryptjs";
import envs from "../../../config/environment-vars";
import { IUserRepository, UserRecord } from "../repository/user.repository";

export class UserService {
    private userRepo: IUserRepository;

    constructor(userRepo: IUserRepository) {
        this.userRepo = userRepo;
    }

    async createUser(user: Omit<UserRecord, "id">): Promise<number> {
        const existing = await this.userRepo.findByEmail(user.email);
        if (existing) {
            throw new Error("Este email ya está registrado");
        }

        user.password = await bcrypt.hash(user.password, envs.BCRYPT_ROUNDS);
        return this.userRepo.create(user);
    }

    async updateUser(id: number, user: Partial<UserRecord>): Promise<boolean> {
        const existing = await this.userRepo.findById(id);
        if (!existing) {
            throw new Error("Usuario no encontrado");
        }
        if (user.email) {
            const emailTaken = await this.userRepo.findByEmail(user.email);
            if (emailTaken && emailTaken.id !== id) {
                throw new Error("El email ya está en uso");
            }
        }
        if (user.password) {
            user.password = await bcrypt.hash(user.password, envs.BCRYPT_ROUNDS);
        }
        return this.userRepo.update(id, user);
    }

    async getUserById(id: number): Promise<UserRecord | null> {
        return this.userRepo.findById(id);
    }

    async getUserByEmail(email: string): Promise<UserRecord | null> {
        return this.userRepo.findByEmail(email);
    }

    async getAllUsers(): Promise<UserRecord[]> {
        return this.userRepo.findAllActive();
    }

    async deleteUser(id: number): Promise<boolean> {
        return this.userRepo.delete(id);
    }
}