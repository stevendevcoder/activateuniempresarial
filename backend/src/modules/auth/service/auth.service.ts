import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import envs from "../../../config/environment-vars";
import { IUserRepository } from "../repository/user.repository";

export class AuthService {
    private userRepo: IUserRepository;

    constructor(userRepo: IUserRepository) {
        this.userRepo = userRepo;
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

        return AuthService.sign({ id: user.id, email: user.email });
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