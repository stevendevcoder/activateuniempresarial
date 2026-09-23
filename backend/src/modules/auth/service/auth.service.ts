import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import envs from "../../../config/environment-vars";
import { IUserRepository } from "../repository/user.repository";
import { IRoleRepository } from "../../roles/repository/role.repository";
import { ADMIN_ROLE_NAME } from "../../../config/permissions";

export interface JwtAuthPayload extends JwtPayload {
    id: number;
    email: string;
    id_role: number | null;
    idArea: number | null;
    role: string | null;
    permissions: string[];
}

export class AuthService {
    private userRepo: IUserRepository;
    private roleRepo: IRoleRepository;

    constructor(userRepo: IUserRepository, roleRepo: IRoleRepository) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
    }

    async login(email: string, password: string): Promise<string> {
        const user = await this.userRepo.findByEmail(email);
        if (!user || user.status !== 1) {
            throw new Error("Credenciales Inválidas");
        }

        const passMatch = await bcrypt.compare(password, user.password);
        if (!passMatch) {
            throw new Error("Credenciales Inválidas");
        }

        const permissions = await this.resolvePermissions(user.idRole, user.roleName);
        return AuthService.sign({
            id: user.id,
            email: user.email,
            id_role: user.idRole,
            idArea: user.idArea,
            role: user.roleName,
            permissions,
        });
    }

    private async resolvePermissions(idRole: number | null, roleName: string | null): Promise<string[]> {
        if (roleName === ADMIN_ROLE_NAME) {
            return ["*"];
        }
        if (idRole == null) {
            return [];
        }
        return this.roleRepo.findPermissionNamesByRole(idRole);
    }

    static sign(payload: object): string {
        return jwt.sign(payload, envs.JWT_SECRET as Secret, {
            expiresIn: envs.JWT_EXPIRES_IN,
        } as jwt.SignOptions);
    }

    static verifyToken(token: string): string | JwtPayload {
        return jwt.verify(token, envs.JWT_SECRET as Secret);
    }
}