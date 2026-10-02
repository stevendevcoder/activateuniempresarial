import { Request, Response } from "express";
import { INVALID_RESET_TOKEN, PasswordResetService } from "../../application/password-reset.service";
import { loadForgotPasswordData, loadResetPasswordData } from "./validation/password-reset.validation";

const GENERIC_FORGOT_MESSAGE =
    "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.";

export class PasswordResetController {
    private resetService: PasswordResetService;

    constructor(resetService: PasswordResetService) {
        this.resetService = resetService;
    }

    async forgot(req: Request, res: Response): Promise<Response> {
        let email: string;
        try {
            ({ email } = loadForgotPasswordData(req.body));
        } catch (error) {
            return res.status(400).json({ error: (error as Error).message });
        }

        try {
            await this.resetService.requestReset(email);
        } catch (error) {
            // Un fallo de SMTP no debe revelar si la cuenta existe: se registra y se responde igual.
            console.error("[password-reset] no se pudo enviar el correo:", error);
        }
        return res.status(200).json({ message: GENERIC_FORGOT_MESSAGE });
    }

    async validate(req: Request, res: Response): Promise<Response> {
        const valid = await this.resetService.isTokenValid(String(req.params.token ?? ""));
        if (!valid) {
            return res.status(400).json({ error: INVALID_RESET_TOKEN });
        }
        return res.status(200).json({ valid: true });
    }

    async reset(req: Request, res: Response): Promise<Response> {
        try {
            const { token, password } = loadResetPasswordData(req.body);
            await this.resetService.resetPassword(token, password);
            return res.status(200).json({ message: "Contraseña actualizada. Ya puedes iniciar sesión." });
        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }
}
