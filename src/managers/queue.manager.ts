import { QueueTemplate, JobResult, JobStatus, JobOptions, JobHandler } from "../templates/queue.template.js";
import { BullMQQueue } from "./queues/bullmq.queue.js";

export type QueueDriver = "bullmq";

class QueueManager {
    private drivers: Map<QueueDriver, QueueTemplate> = new Map();

    constructor() {
        this.drivers.set("bullmq", new BullMQQueue());
        // this.drivers.set("bee-queue", new BeeQueue());
        // this.drivers.set("agenda",    new AgendaQueue());
    }

    // ── Resolve (auto-reconnects) ─────────────────────────────────────────────

    private async resolve(driver: QueueDriver): Promise<QueueTemplate> {
        const queue = this.drivers.get(driver);
        if (!queue) throw new Error(`[QueueManager] Unknown driver: "${driver}"`);

        if (!queue.isConnected()) {
            console.warn(`[QueueManager] Driver "${driver}" not connected. Reconnecting...`);
            await queue.connect();
        }

        return queue;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async connect(driver: QueueDriver): Promise<void> {
        const queue = this.drivers.get(driver);
        if (!queue) throw new Error(`[QueueManager] Unknown driver: "${driver}"`);
        await queue.connect();
    }

    async disconnect(driver: QueueDriver): Promise<void> {
        await this.drivers.get(driver)?.disconnect();
    }

    // ── Queue API ─────────────────────────────────────────────────────────────

    async add<T>(driver: QueueDriver, queue: string, name: string, data: T, options?: JobOptions): Promise<JobResult> {
        return (await this.resolve(driver)).add(queue, name, data, options);
    }

    process<T>(driver: QueueDriver, queue: string, name: string, handler: JobHandler<T>): void {
        const q = this.drivers.get(driver);
        if (!q) throw new Error(`[QueueManager] Unknown driver: "${driver}"`);
        q.process(queue, name, handler);
    }

    async status(driver: QueueDriver, queue: string, jobId: string): Promise<JobStatus> {
        return (await this.resolve(driver)).status(queue, jobId);
    }

    async remove(driver: QueueDriver, queue: string, jobId: string): Promise<boolean> {
        return (await this.resolve(driver)).remove(queue, jobId);
    }

    async drain(driver: QueueDriver, queue: string): Promise<void> {
        return (await this.resolve(driver)).drain(queue);
    }

    async count(driver: QueueDriver, queue: string): Promise<number> {
        return (await this.resolve(driver)).count(queue);
    }
}

export default new QueueManager();