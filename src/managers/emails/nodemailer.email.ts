import nodemailer, { Transporter } from "nodemailer";
import { EmailTemplate, EmailPayload, SendResult } from "../../templates/email.template.js";

const HOST = process.env["NODEMAILER_EMAIL_SMTP_HOST"] ?? "smtp.gmail.com";
const PORT = parseInt(process.env["NODEMAILER_EMAIL_SMTP_PORT"] ?? "587");
const USER = process.env["NODEMAILER_EMAIL_SMTP_USER"] ?? "";
const PASS = process.env["NODEMAILER_EMAIL_SMTP_PASS"] ?? "";
const FROM = process.env["NODEMAILER_EMAIL_FROM"] ?? USER;

export class NodemailerEmail extends EmailTemplate {
    protected driverName = "nodemailer";
    private transporter: Transporter | null = null;
    private connected = false;

    async connect(): Promise<void> {
        if (!USER || !PASS) throw new Error("[NodemailerEmail] NODEMAILER_EMAIL_SMTP_USER or NODEMAILER_EMAIL_SMTP_PASS is not set");

        this.transporter = nodemailer.createTransport({
            host: HOST,
            port: PORT,
            secure: PORT === 465,
            auth: {
                user: USER,
                pass: PASS,
            },
        });

        await this.transporter.verify();
        this.connected = true;
        console.log("[NodemailerEmail] Connected");
    }

    async disconnect(): Promise<void> {
        this.transporter?.close();
        this.transporter = null;
        this.connected = false;
        console.log("[NodemailerEmail] Disconnected");
    }

    isConnected(): boolean {
        return this.connected;
    }

    async send(payload: EmailPayload): Promise<SendResult> {
        if (!this.transporter) return { id: null, error: "[NodemailerEmail] Not connected" };
        if (!payload.html && !payload.text) return { id: null, error: "[NodemailerEmail] Either html or text is required" };

        try {
            const info = await this.transporter.sendMail({
                from: FROM,
                to: payload.to,
                subject: payload.subject,
                html: payload.html,
                text: payload.text,
            });

            return { id: info.messageId ?? null, error: null };
        } catch (err) {
            return { id: null, error: String(err) };
        }
    }
}