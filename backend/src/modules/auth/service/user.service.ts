import bcrypt from "bcryptjs";
import envs from "../../../config/environment-vars";
import { IUserRepository, UserRecord, UserInput, UserFilters } from "../repository/user.repository";
import { IRoleRepository } from "../../roles/repository/role.repository";
import { IAreaRepository } from "../../areas/repository/area.repository";

export class UserService {
    private userRepo: IUserRepository;
    private roleRepo: IRoleRepository;
    private areaRepo: IAreaRepository;

    constructor(userRepo: IUserRepository, roleRepo: IRoleRepository, areaRepo: IAreaRepository) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.areaRepo = areaRepo;
    }

    private async validateRole(idRole: number | null): Promise<void> {
        if (idRole == null) return;

        const role = await this.roleRepo.findById(idRole);
        if (!role) {
            throw new Error("El rol indicado no existe");
        }
        if (role.status !== 1) {
            throw new Error("El rol indicado está inactivo");
        }
    }

    private async validateArea(idArea: number | null): Promise<void> {
        if (idArea == null) return;

        const area = await this.areaRepo.findById(idArea);
        if (!area) {
            throw new Error("El área indicada no existe");
        }
        if (area.status !== 1) {
            throw new Error("El área indicada está inactiva");
        }
    }

    async createUser(user: UserInput): Promise<number> {
        const existing = await this.userRepo.findByEmail(user.email);
        if (existing) {
            throw new Error("Este email ya está registrado");
        }

        await this.validateRole(user.idRole);
        await this.validateArea(user.idArea);

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
        if (user.idRole !== undefined) {
            await this.validateRole(user.idRole);
        }
        if (user.idArea !== undefined) {
            await this.validateArea(user.idArea);
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

    async getAllUsers(filters: UserFilters = {}): Promise<UserRecord[]> {
        return this.userRepo.findAll(filters);
    }

    async deleteUser(id: number): Promise<boolean> {
        return this.userRepo.delete(id);
    }

    async activateUser(id: number): Promise<boolean> {
        const existing = await this.userRepo.findById(id);
        if (!existing) {
            throw new Error("Usuario no encontrado");
        }
        return this.userRepo.update(id, { status: 1 });
    }
}