import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { SocketTemplate, SocketResult, RoomResult, SocketHandler } from "../../templates/socket.template.js";

const MODE = process.env["MODE"] ?? "development";
const CLIENT_PORT = MODE === "deployed" ? "" : process.env["CLIENT_PORT"] ?? "5173";
const CLIENT_CURL = MODE === "deployed" ? process.env["DEPLOYED_FRONTEND_URL"] ?? "" : "http://localhost:";
const CLIENT_URL = `${CLIENT_CURL}${CLIENT_PORT}`;

export class SocketIOSocket extends SocketTemplate {
    protected driverName = "socketio";
    private io: SocketIOServer | null = null;
    private connected = false;
    private handlers: Map<string, SocketHandler<unknown>> = new Map();

    async connect(server: HttpServer): Promise<void> {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: CLIENT_URL,
                methods: ["GET", "POST"],
            },
        });

        this.io.on("connection", (socket: Socket) => {
            console.log(`[SocketIO] Connected: ${socket.id}`);

            // attach all registered handlers
            for (const [event, handler] of this.handlers) {
                socket.on(event, (data: unknown) => handler(data, socket.id));
            }

            socket.on("disconnect", () => {
                console.log(`[SocketIO] Disconnected: ${socket.id}`);
            });
        });

        this.connected = true;
        console.log("[SocketIO] Connected");
    }

    async disconnect(): Promise<void> {
        await new Promise<void>((resolve) => this.io?.close(() => resolve()));
        this.io = null;
        this.connected = false;
        console.log("[SocketIO] Disconnected");
    }

    isConnected(): boolean {
        return this.connected;
    }

    // ── Emit ─────────────────────────────────────────────────────────────────

    emit(socketId: string, event: string, data: unknown): SocketResult {
        try {
            if (!this.io) throw new Error("[SocketIO] Not connected");
            this.io.to(socketId).emit(event, data);
            return { event, data, error: null };
        } catch (err) {
            return { event, data: null, error: String(err) };
        }
    }

    broadcast(event: string, data: unknown): SocketResult {
        try {
            if (!this.io) throw new Error("[SocketIO] Not connected");
            this.io.emit(event, data);
            return { event, data, error: null };
        } catch (err) {
            return { event, data: null, error: String(err) };
        }
    }

    toRoom(room: string, event: string, data: unknown): SocketResult {
        try {
            if (!this.io) throw new Error("[SocketIO] Not connected");
            this.io.to(room).emit(event, data);
            return { event, data, error: null };
        } catch (err) {
            return { event, data: null, error: String(err) };
        }
    }

    // ── Rooms ─────────────────────────────────────────────────────────────────

    async join(socketId: string, room: string): Promise<RoomResult> {
        try {
            if (!this.io) throw new Error("[SocketIO] Not connected");
            const socket = this.io.sockets.sockets.get(socketId);
            if (!socket) return { room, count: 0, error: `Socket ${socketId} not found` };
            await socket.join(room);
            const count = await this.roomCount(room);
            return { room, count, error: null };
        } catch (err) {
            return { room, count: 0, error: String(err) };
        }
    }

    async leave(socketId: string, room: string): Promise<RoomResult> {
        try {
            if (!this.io) throw new Error("[SocketIO] Not connected");
            const socket = this.io.sockets.sockets.get(socketId);
            if (!socket) return { room, count: 0, error: `Socket ${socketId} not found` };
            await socket.leave(room);
            const count = await this.roomCount(room);
            return { room, count, error: null };
        } catch (err) {
            return { room, count: 0, error: String(err) };
        }
    }

    async roomCount(room: string): Promise<number> {
        try {
            if (!this.io) return 0;
            const sockets = await this.io.in(room).fetchSockets();
            return sockets.length;
        } catch {
            return 0;
        }
    }

    async rooms(socketId: string): Promise<string[]> {
        try {
            if (!this.io) return [];
            const socket = this.io.sockets.sockets.get(socketId);
            if (!socket) return [];
            return Array.from(socket.rooms);
        } catch {
            return [];
        }
    }

    // ── Listeners ─────────────────────────────────────────────────────────────

    on<T>(event: string, handler: SocketHandler<T>): void {
        this.handlers.set(event, handler as SocketHandler<unknown>);

        // attach to already connected sockets
        if (this.io) {
            for (const socket of this.io.sockets.sockets.values()) {
                socket.on(event, (data: unknown) => handler(data as T, socket.id));
            }
        }
    }

    off(event: string): void {
        this.handlers.delete(event);
        if (this.io) {
            for (const socket of this.io.sockets.sockets.values()) {
                socket.removeAllListeners(event);
            }
        }
    }

    // ── Info ──────────────────────────────────────────────────────────────────

    connectedCount(): number {
        return this.io?.sockets.sockets.size ?? 0;
    }

    connectedIds(): string[] {
        if (!this.io) return [];
        return Array.from(this.io.sockets.sockets.keys());
    }
}