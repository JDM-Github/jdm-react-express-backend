export interface SendResult {
    id: string | null;
    error: string | null;
}

export interface EmailPayload {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
}

export abstract class EmailTemplate {
    protected abstract driverName: string;

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;
    abstract send(payload: EmailPayload): Promise<SendResult>;

    getName(): string {
        return this.driverName;
    }
}