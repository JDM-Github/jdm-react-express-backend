import { Queue, Worker, Job, ConnectionOptions } from "bullmq";
import { QueueTemplate, JobResult, JobStatus, JobOptions, JobHandler } from "../../templates/queue.template.js";

const ENV_MAP: Record<string, string> = {
    development: process.env["QUEUE_DEVELOPMENT"] ?? "redis://localhost:6379",
    production: process.env["QUEUE_PRODUCTION"] ?? "",
    deployed: process.env["QUEUE_DEPLOYED"] ?? "",
};

const MODE = process.env["MODE"] ?? "development";

export class BullMQQueue extends QueueTemplate {
    protected driverName = "bullmq";
    private queues: Map<string, Queue> = new Map();
    private workers: Map<string, Worker> = new Map();
    private connection: ConnectionOptions | null = null;
    private connected = false;

    async connect(): Promise<void> {
        const url = ENV_MAP[MODE];
        if (!url) throw new Error(`[BullMQQueue] No connection URL for mode: ${MODE}`);

        const parsed = new URL(url);
        this.connection = {
            host: parsed.hostname,
            port: parseInt(parsed.port ?? "6379"),
            password: parsed.password || undefined,
        };

        this.connected = true;
        console.log("[BullMQQueue] Connected");
    }

    async disconnect(): Promise<void> {
        for (const worker of this.workers.values()) await worker.close();
        for (const queue of this.queues.values()) await queue.close();
        this.workers.clear();
        this.queues.clear();
        this.connected = false;
        console.log("[BullMQQueue] Disconnected");
    }

    isConnected(): boolean {
        return this.connected;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private getQueue(name: string): Queue {
        if (!this.connection) throw new Error("[BullMQQueue] Not connected");

        if (!this.queues.has(name)) {
            this.queues.set(name, new Queue(name, { connection: this.connection }));
        }

        return this.queues.get(name)!;
    }

    // ── QueueTemplate implementation ──────────────────────────────────────────

    async add<T>(queue: string, name: string, data: T, options?: JobOptions): Promise<JobResult> {
        try {
            const q = this.getQueue(queue);
            const job = await q.add(name, data, {
                delay: options?.delay,
                attempts: options?.attempts ?? 3,
                priority: options?.priority,
                repeat: options?.repeat,
                backoff: { type: "exponential", delay: 1000 },
            });

            return { id: job.id ?? null, name: job.name, data: job.data, error: null };
        } catch (err) {
            return { id: null, name, data: null, error: String(err) };
        }
    }

    process<T>(queue: string, name: string, handler: JobHandler<T>): void {
        if (!this.connection) throw new Error("[BullMQQueue] Not connected");

        if (this.workers.has(`${queue}:${name}`)) return;

        const worker = new Worker(
            queue,
            async (job: Job) => {
                if (job.name === name) {
                    await handler(job.data as T);
                }
            },
            { connection: this.connection }
        );

        worker.on("completed", (job) => console.log(`[BullMQQueue] Job completed: ${job.id}`));
        worker.on("failed", (job, err) => console.error(`[BullMQQueue] Job failed: ${job?.id}`, err));

        this.workers.set(`${queue}:${name}`, worker);
        console.log(`[BullMQQueue] Worker registered: ${queue}:${name}`);
    }

    async status(queue: string, jobId: string): Promise<JobStatus> {
        try {
            const q = this.getQueue(queue);
            const job = await q.getJob(jobId);

            if (!job) return { id: jobId, name: null, state: "not_found", progress: 0, attempts: 0, error: null };

            const state = await job.getState();
            return {
                id: job.id ?? null,
                name: job.name ?? null,
                state,
                progress: job.progress as number ?? 0,
                attempts: job.attemptsMade ?? 0,
                error: job.failedReason ?? null,
            };
        } catch (err) {
            return { id: jobId, name: null, state: null, progress: 0, attempts: 0, error: String(err) };
        }
    }

    async remove(queue: string, jobId: string): Promise<boolean> {
        try {
            const q = this.getQueue(queue);
            const job = await q.getJob(jobId);
            if (!job) return false;
            await job.remove();
            return true;
        } catch {
            return false;
        }
    }

    async drain(queue: string): Promise<void> {
        const q = this.getQueue(queue);
        await q.drain();
        console.log(`[BullMQQueue] Drained: ${queue}`);
    }

    async count(queue: string): Promise<number> {
        try {
            const q = this.getQueue(queue);
            return await q.count();
        } catch {
            return 0;
        }
    }
}