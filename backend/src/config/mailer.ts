import nodemailer, { type Transporter } from "nodemailer";
import envs from "./environment-vars";

export interface MailMessage {
    to: string;
    subject: string;
    text: string;
    html: string;
}

let transporter: Transporter | null = null;

export function isMailerConfigured(): boolean {
    return envs.SMTP_HOST.trim() !== "";
}

function getTransporter(): Transporter {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: envs.SMTP_HOST,
            port: envs.SMTP_PORT,
            secure: envs.SMTP_SECURE,
            auth: envs.SMTP_USER ? { user: envs.SMTP_USER, pass: envs.SMTP_PASS } : undefined,
        });
    }
    return transporter;
}

/**
 * Envía un correo por SMTP. Sin SMTP configurado (desarrollo) imprime el mensaje en consola
 * para poder probar los flujos que dependen del correo, como la recuperación de contraseña.
 */
export async function sendMail(message: MailMessage): Promise<void> {
    if (!isMailerConfigured()) {
        console.log(`[mailer] SMTP no configurado. Correo para ${message.to}:\n  ${message.subject}\n  ${message.text}`);
        return;
    }
    await getTransporter().sendMail({ from: envs.SMTP_FROM, ...message });
}
