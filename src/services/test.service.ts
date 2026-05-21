import { JwtPayload } from "../utils/jwt.js";
import EmailManager from "../managers/email.manager.js";
import StorageManager from "../managers/storage.manager.js";
import CacheManager from "../managers/cache.manager.js";
import QueueManager from "../managers/queue.manager.js";
import SocketManager from "../managers/socket.manager.js";
import type { EmailDriver } from "../managers/email.manager.js";
import type { StorageDriver } from "../managers/storage.manager.js";
import type { CacheDriver } from "../managers/cache.manager.js";
import type { QueueDriver } from "../managers/queue.manager.js";
import type { SocketDriver } from "../managers/socket.manager.js";

const TARGET_EMAIL = (process.env["TARGET_EMAIL"] ?? "nodemailer") as EmailDriver;
const TARGET_STORAGE = (process.env["TARGET_STORAGE"] ?? "cloudinary") as StorageDriver;
const TARGET_CACHE = (process.env["TARGET_CACHE"] ?? "redis") as CacheDriver;
const TARGET_QUEUE = (process.env["TARGET_QUEUE"] ?? "bullmq") as QueueDriver;
const TARGET_SOCKET = (process.env["TARGET_SOCKET"] ?? "socketio") as SocketDriver;

interface GetTestResult {
    timestamp: string;
    number: string | null;
    user: JwtPayload | undefined;
}

interface PostTestResult {
    received: unknown;
    user: JwtPayload | undefined;
}

interface PostEmailResult {
    id: string | null;
    error: string | null;
}

class TestService {

    // ── Basic ─────────────────────────────────────────────────────────────────

    public async getTest(
        number: string | undefined,
        user: JwtPayload | undefined
    ): Promise<GetTestResult> {
        return {
            timestamp: new Date().toISOString(),
            number: number ?? null,
            user,
        };
    }

    public async postTest(
        body: unknown,
        user: JwtPayload | undefined
    ): Promise<PostTestResult> {
        return { received: body, user };
    }

    // ── Email ─────────────────────────────────────────────────────────────────

    public async postEmail(
        _: unknown,
        user: JwtPayload | undefined
    ): Promise<PostEmailResult> {
        return EmailManager.send(TARGET_EMAIL, {
            to: "delivered@resend.dev",
            subject: "Test Email",
            html: `<h1>Hello ${user?.email ?? "stranger"}</h1><p>This is a test email.</p>`,
        });
    }

    // ── Storage ───────────────────────────────────────────────────────────────

    public async postUpload(body: unknown) {
        const { url, folder } = body as { url: string; folder?: string };
        if (!url) return { id: null, url: null, secureUrl: null, error: "url is required" };
        return StorageManager.upload(TARGET_STORAGE, url, { folder: folder ?? "test" });
    }

    public async deleteUpload(id: string) {
        if (!id) return { id: null, deleted: false, error: "id is required" };
        return StorageManager.delete(TARGET_STORAGE, id);
    }

    public async uploadFile(buffer: Buffer, filename: string, folder?: string) {
        const publicId = `${Date.now()}-${filename.replace(/\.[^/.]+$/, "")}`;
        return StorageManager.upload(TARGET_STORAGE, buffer, {
            folder: folder ?? "uploads",
            publicId: publicId ?? undefined,
        });
    }

    public async uploadFiles(files: Express.Multer.File[], folder?: string) {
        return StorageManager.uploadBatch(
            TARGET_STORAGE,
            files.map((f) => f.buffer),
            { folder: folder ?? "uploads" }
        );
    }

    // ── Cache ─────────────────────────────────────────────────────────────────

    public async postCache(body: unknown) {
        const { key, value, ttl } = body as { key: string; value: unknown; ttl?: number };
        if (!key) return { key: null, value: null, error: "key is required" };
        if (!value) return { key: null, value: null, error: "value is required" };
        return CacheManager.set(TARGET_CACHE, key, value, ttl);
    }

    public async getCache(key: string) {
        if (!key) return { key: null, value: null, error: "key is required" };
        const result = await CacheManager.get(TARGET_CACHE, key);
        const ttl = await CacheManager.ttl(TARGET_CACHE, key);
        return { ...result, ttl };
    }

    public async deleteCache(key: string) {
        if (!key) return { key: null, deleted: false, error: "key is required" };
        return CacheManager.delete(TARGET_CACHE, key);
    }

    public async flushCache() {
        await CacheManager.flush(TARGET_CACHE);
        return { flushed: true, error: null };
    }

    // ── Queue ─────────────────────────────────────────────────────────────────

    public async postQueue(body: unknown) {
        const { queue, name, data, options } = body as {
            queue: string;
            name: string;
            data: unknown;
            options?: { delay?: number; attempts?: number; priority?: number };
        };

        if (!queue) return { id: null, name: null, data: null, error: "queue is required" };
        if (!name) return { id: null, name: null, data: null, error: "name is required" };
        if (!data) return { id: null, name: null, data: null, error: "data is required" };

        return QueueManager.add(TARGET_QUEUE, queue, name, data, options);
    }

    public async getQueueStatus(queue: string, jobId: string) {
        if (!queue) return { id: null, name: null, state: null, progress: 0, attempts: 0, error: "queue is required" };
        if (!jobId) return { id: null, name: null, state: null, progress: 0, attempts: 0, error: "jobId is required" };
        return QueueManager.status(TARGET_QUEUE, queue, jobId);
    }

    public async deleteQueue(queue: string, jobId: string) {
        if (!queue) return { removed: false, error: "queue is required" };
        if (!jobId) return { removed: false, error: "jobId is required" };
        const removed = await QueueManager.remove(TARGET_QUEUE, queue, jobId);
        return { removed, error: null };
    }

    // ── Socket ────────────────────────────────────────────────────────────────

    public async getSocket() {
        const count = SocketManager.connectedCount(TARGET_SOCKET);
        const ids = SocketManager.connectedIds(TARGET_SOCKET);
        return { connectedCount: count, connectedIds: ids, error: null };
    }

    public async postSocketBroadcast(body: unknown) {
        const { event, data } = body as { event: string; data: unknown };
        if (!event) return { event: null, data: null, error: "event is required" };
        if (!data) return { event: null, data: null, error: "data is required" };
        return SocketManager.broadcast(TARGET_SOCKET, event, data);
    }

    public async postSocketEmit(body: unknown) {
        const { socketId, event, data } = body as { socketId: string; event: string; data: unknown };
        if (!socketId) return { event: null, data: null, error: "socketId is required" };
        if (!event) return { event: null, data: null, error: "event is required" };
        if (!data) return { event: null, data: null, error: "data is required" };
        return SocketManager.emit(TARGET_SOCKET, socketId, event, data);
    }

    public async postSocketRoom(body: unknown) {
        const { room, event, data } = body as { room: string; event: string; data: unknown };
        if (!room) return { event: null, data: null, error: "room is required" };
        if (!event) return { event: null, data: null, error: "event is required" };
        if (!data) return { event: null, data: null, error: "data is required" };
        return SocketManager.toRoom(TARGET_SOCKET, room, event, data);
    }
}

export default new TestService();