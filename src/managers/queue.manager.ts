import { ManagerTemplate } from "../templates/manager.template.js";
import { QueueTemplate, JobResult, JobStatus, JobOptions, JobHandler } from "../templates/queue.template.js";
import { BullMQQueue } from "./queues/bullmq.queue.js";

export type QueueDriver = "bullmq";

class QueueManager extends ManagerTemplate<QueueDriver, QueueTemplate> {
    protected label = "QueueManager";

    constructor() {
        super();
        this.drivers.set("bullmq", new BullMQQueue());
    }

    async add<T>(driver: QueueDriver, queue: string, name: string, data: T, options?: JobOptions): Promise<JobResult> {
        return (await this.resolve(driver)).add(queue, name, data, options);
    }

    process<T>(driver: QueueDriver, queue: string, name: string, handler: JobHandler<T>): void {
        this.resolveSync(driver).process(queue, name, handler);
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