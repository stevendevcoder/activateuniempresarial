import crypto from "crypto";
import bcrypt from "bcryptjs";
import { IsNull, MoreThan, Repository } from "typeorm";
import { AppDataSource } from "../../../config/data-base";
import envs from "../../../config/environment-vars";
import { sendMail } from "../../../config/mailer";
import { IUserRepository } from "../infrastructure/persistence/user.repository";
import { PasswordReset } from "../infrastructure/persistence/password-reset.entity";

export const INVALID_RESET_TOKEN = "El enlace de recuperación no es válido o ya expiró";

function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

export class PasswordResetService {
    private userRepo: IUserRepository;
    private resetRepo: Repository<PasswordReset>;

    constructor(userRepo: IUserRepository) {
        this.userRepo = userRepo;
        this.resetRepo = AppDataSource.getRepository(PasswordReset);
    }

    /**
     * Genera un token de un solo uso y envía el enlace por correo. Si el correo no existe o el
     * usuario está inactivo no hace nada, para no revelar qué cuentas están registradas.
     */
    async requestReset(email: string): Promise<void> {
        const user = await this.userRepo.findByEmail(email);
        if (!user || user.status !== 1) return;

        // Solo el enlace más reciente sirve: se invalidan los anteriores pendientes.
        await this.resetRepo.update({ id_user: user.id, used_at: IsNull() }, { used_at: new Date() });

        const token = crypto.randomBytes(32).toString("hex");
        const ttl = envs.PASSWORD_RESET_TTL_MINUTES;
        await this.resetRepo.save(
            this.resetRepo.create({
                id_user: user.id,
                token_hash: hashToken(token),
                expires_at: new Date(Date.now() + ttl * 60_000),
                used_at: null,
            })
        );

        const link = `${envs.FRONTEND_URL}/restablecer?token=${token}`;
        await sendMail({
            to: user.email,
            subject: "Restablece tu contraseña de ACTIVATE",
            text: `Hola ${user.name}, recibimos una solicitud para restablecer tu contraseña. Abre este enlace (válido por ${ttl} minutos): ${link}. Si no fuiste tú, ignora este mensaje.`,
            html: `
                <p>Hola <strong>${escapeHtml(user.name)}</strong>,</p>
                <p>Recibimos una solicitud para restablecer tu contraseña de ACTIVATE Pausas Saludables.</p>
                <p><a href="${link}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#1e3a8a;color:#fff;text-decoration:none;font-weight:bold">Restablecer contraseña</a></p>
                <p>El enlace es válido por ${ttl} minutos y solo puede usarse una vez.</p>
                <p style="color:#64748b">Si no solicitaste este cambio, ignora este correo: tu contraseña actual sigue funcionando.</p>
            `,
        });
    }

    /** Indica si el token existe, no se ha usado y no ha expirado. */
    async isTokenValid(token: string): Promise<boolean> {
        return (await this.findActive(token)) !== null;
    }

    async resetPassword(token: string, password: string): Promise<void> {
        const reset = await this.findActive(token);
        if (!reset) {
            throw new Error(INVALID_RESET_TOKEN);
        }

        const hash = await bcrypt.hash(password, envs.BCRYPT_ROUNDS);
        const updated = await this.userRepo.update(reset.id_user, { password: hash });
        if (!updated) {
            throw new Error(INVALID_RESET_TOKEN);
        }

        reset.used_at = new Date();
        await this.resetRepo.save(reset);
    }

    private async findActive(token: string): Promise<PasswordReset | null> {
        if (!/^[a-f0-9]{64}$/.test(token)) return null;
        return this.resetRepo.findOne({
            where: { token_hash: hashToken(token), used_at: IsNull(), expires_at: MoreThan(new Date()) },
        });
    }
}
