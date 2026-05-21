import { EmailTemplate, EmailPayload, SendResult } from "../templates/email.template.js";
import { NodemailerEmail } from "./emails/nodemailer.email.js";
import { ResendEmail } from "./emails/resend.email.js";

export type EmailDriver = "resend" | "nodemailer";

class EmailManager {
    private drivers: Map<EmailDriver, EmailTemplate> = new Map();

    constructor() {
        this.drivers.set("resend", new ResendEmail());
        this.drivers.set("nodemailer", new NodemailerEmail());
        // this.drivers.set("sendgrid",   new SendgridEmail());
        // this.drivers.set("mailgun",    new MailgunEmail());
    }

    // ── Resolve (auto-reconnects) ─────────────────────────────────────────────

    private async resolve(driver: EmailDriver): Promise<EmailTemplate> {
        const email = this.drivers.get(driver);
        if (!email) throw new Error(`[EmailManager] Unknown driver: "${driver}"`);

        if (!email.isConnected()) {
            console.warn(`[EmailManager] Driver "${driver}" not connected. Reconnecting...`);
            await email.connect();
        }

        return email;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async connect(driver: EmailDriver): Promise<void> {
        const email = this.drivers.get(driver);
        if (!email) throw new Error(`[EmailManager] Unknown driver: "${driver}"`);
        await email.connect();
    }

    async disconnect(driver: EmailDriver): Promise<void> {
        await this.drivers.get(driver)?.disconnect();
    }

    // ── Send API ──────────────────────────────────────────────────────────────

    async send(driver: EmailDriver, payload: EmailPayload): Promise<SendResult> {
        const email = await this.resolve(driver);
        return email.send(payload);
    }
}

export default new EmailManager();