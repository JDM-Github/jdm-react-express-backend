export interface JobResult {
    id: string | null;
    name: string | null;
    data: unknown;
    error: string | null;
}

export interface JobStatus {
    id: string | null;
    name: string | null;
    state: string | null;
    progress: number;
    attempts: number;
    error: string | null;
}

export interface JobOptions {
    delay?: number;   // ms before job runs
    attempts?: number;   // retry attempts on failure
    priority?: number;   // higher = sooner
    repeat?: {
        pattern: string; // cron string e.g. "0 * * * *"
        limit?: number;
    };
}

export type JobHandler<T = unknown> = (data: T) => Promise<void>;

export abstract class QueueTemplate {
    protected abstract driverName: string;

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;

    abstract add<T>(queue: string, name: string, data: T, options?: JobOptions): Promise<JobResult>;
    abstract process<T>(queue: string, name: string, handler: JobHandler<T>): void;
    abstract status(queue: string, jobId: string): Promise<JobStatus>;
    abstract remove(queue: string, jobId: string): Promise<boolean>;
    abstract drain(queue: string): Promise<void>;
    abstract count(queue: string): Promise<number>;

    getName(): string {
        return this.driverName;
    }
}