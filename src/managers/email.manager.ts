import { EmailTemplate, EmailPayload, SendResult } from "../templates/email.template.js";
import { ManagerTemplate } from "../templates/manager.template.js";
import { NodemailerEmail } from "./emails/nodemailer.email.js";
import { ResendEmail } from "./emails/resend.email.js";

export type EmailDriver = "resend" | "nodemailer";

class EmailManager extends ManagerTemplate<EmailDriver, EmailTemplate> {
    protected label = "EmailManager";

    constructor() {
        super();
        this.drivers.set("resend", new ResendEmail());
        this.drivers.set("nodemailer", new NodemailerEmail());
    }

    async send(driver: EmailDriver, payload: EmailPayload): Promise<SendResult> {
        return (await this.resolve(driver)).send(payload);
    }
}

export default new EmailManager();