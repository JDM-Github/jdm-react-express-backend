import "./configs/env.config.js";
import routeConfig from "./configs/route.config.js";

import { createServer } from "http";
import express, { Request, Response } from "express";
import cors from "cors";

import DatabaseManager from "./managers/database.manager.js";
import EmailManager from "./managers/email.manager.js";
import StorageManager from "./managers/storage.manager.js";
import CacheManager from "./managers/cache.manager.js";
import QueueManager from "./managers/queue.manager.js";
import SocketManager from "./managers/socket.manager.js";
import type { DatabaseDriver } from "./managers/database.manager.js";
import type { EmailDriver } from "./managers/email.manager.js";
import type { StorageDriver } from "./managers/storage.manager.js";
import type { CacheDriver } from "./managers/cache.manager.js";
import type { QueueDriver } from "./managers/queue.manager.js";
import type { SocketDriver } from "./managers/socket.manager.js";

const app = express();
const router = express.Router();
const server = createServer(app);
const PORT = process.env.BACKEND_PORT ?? 3000;

const TARGET_DATABASE = (process.env["TARGET_DATABASE"] ?? "psql") as DatabaseDriver;
const TARGET_EMAIL = (process.env["TARGET_EMAIL"] ?? "nodemailer") as EmailDriver;
const TARGET_STORAGE = (process.env["TARGET_STORAGE"] ?? "local") as StorageDriver;
const TARGET_CACHE = (process.env["TARGET_CACHE"] ?? "redis") as CacheDriver;
const TARGET_QUEUE = (process.env["TARGET_QUEUE"] ?? "bullmq") as QueueDriver;
const TARGET_SOCKET = (process.env["TARGET_SOCKET"] ?? "socketio") as SocketDriver;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use("/api", router);

// ── Dynamic Routes ────────────────────────────────────────────────────────────

async function registerRoutes(): Promise<void> {
    for (const route of routeConfig) {
        const module = await import(route.module);
        router.use(route.path, module.default);
        console.log(`[Route] Registered: /api${route.path}`);
    }
}

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
    res.json({
        status: "ok",
        message: "Server is running",
        sockets: SocketManager.connectedCount(TARGET_SOCKET),
    });
});

// ── Reconnect ─────────────────────────────────────────────────────────────────

app.post("/reconnect", async (_req: Request, res: Response) => {
    const results: Record<string, string> = {};
    const services: Array<{ name: string; fn: () => Promise<void> }> = [
        {
            name: "database",
            fn: async () => {
                await DatabaseManager.disconnect(TARGET_DATABASE);
                await DatabaseManager.connect(TARGET_DATABASE);
            },
        },
        {
            name: "email",
            fn: async () => {
                await EmailManager.disconnect(TARGET_EMAIL);
                await EmailManager.connect(TARGET_EMAIL);
            },
        },
        {
            name: "storage",
            fn: async () => {
                await StorageManager.disconnect(TARGET_STORAGE);
                await StorageManager.connect(TARGET_STORAGE);
            },
        },
        {
            name: "cache",
            fn: async () => {
                await CacheManager.disconnect(TARGET_CACHE);
                await CacheManager.connect(TARGET_CACHE);
            },
        },
        {
            name: "queue",
            fn: async () => {
                await QueueManager.disconnect(TARGET_QUEUE);
                await QueueManager.connect(TARGET_QUEUE);
            },
        },
        {
            name: "socket",
            fn: async () => {
                await SocketManager.disconnect(TARGET_SOCKET);
                await SocketManager.connect(TARGET_SOCKET, server);
            },
        },
    ];

    for (const service of services) {
        try {
            await service.fn();
            results[service.name] = "reconnected";
        } catch (err) {
            results[service.name] = `failed: ${String(err)}`;
        }
    }

    const hasFailure = Object.values(results).some((v) => v.startsWith("failed"));
    res.status(hasFailure ? 500 : 200).json({
        success: !hasFailure,
        message: hasFailure ? "Some services failed to reconnect" : "All services reconnected",
        data: results,
    });
});

// ── Queue Workers ─────────────────────────────────────────────────────────────

function registerWorkers(): void {
    QueueManager.process(TARGET_QUEUE, "email", "send", async (data: unknown) => {
        const { to, subject, html } = data as { to: string; subject: string; html: string };
        await EmailManager.send(TARGET_EMAIL, { to, subject, html });
    });
}

// ── Socket Events ─────────────────────────────────────────────────────────────

function registerSocketEvents(): void {
    SocketManager.on(TARGET_SOCKET, "message", (data: unknown, socketId: string) => {
        console.log(`[Socket] Message from ${socketId}:`, data);
        SocketManager.emit(TARGET_SOCKET, socketId, "message", { received: data });
    });
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
    await registerRoutes();
    await DatabaseManager.connect(TARGET_DATABASE);
    await EmailManager.connect(TARGET_EMAIL);
    await StorageManager.connect(TARGET_STORAGE);
    await CacheManager.connect(TARGET_CACHE);
    await QueueManager.connect(TARGET_QUEUE);
    await SocketManager.connect(TARGET_SOCKET, server);

    registerWorkers();
    registerSocketEvents();
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

bootstrap().catch((err) => {
    console.error("[Server] Failed to start:", err);
    process.exit(1);
});