import { Resend } from "resend";
import { EmailTemplate, EmailPayload, SendResult } from "../../templates/email.template.js";

const API_KEY = process.env["RESEND_EMAIL_API_KEY"] ?? "";
const FROM = process.env["RESEND_EMAIL_FROM"] ?? "onboarding@resend.dev";

export class ResendEmail extends EmailTemplate {
    protected driverName = "resend";
    private client: Resend | null = null;
    private connected = false;

    async connect(): Promise<void> {
        if (!API_KEY) throw new Error("[ResendEmail] RESEND_EMAIL_API_KEY is not set");
        this.client = new Resend(API_KEY);
        this.connected = true;
        console.log("[ResendEmail] Connected");
    }

    async disconnect(): Promise<void> {
        this.client = null;
        this.connected = false;
        console.log("[ResendEmail] Disconnected");
    }

    isConnected(): boolean {
        return this.connected;
    }

    async send(payload: EmailPayload): Promise<SendResult> {
        if (!this.client) return { id: null, error: "[ResendEmail] Not connected" };
        if (!payload.html && !payload.text) {
            return { id: null, error: "[ResendEmail] Either html or text is required" };
        }

        try {
            const { data, error } = await this.client.emails.send({
                from: FROM,
                to: payload.to,
                subject: payload.subject,
                html: payload.html,
                text: payload.text,
            } as any);

            if (error) return { id: null, error: error.message };
            return { id: data?.id ?? null, error: null };
        } catch (err) {
            return { id: null, error: String(err) };
        }
    }
}