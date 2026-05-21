import { Server as HttpServer } from "http";
import { SocketTemplate, SocketResult, RoomResult, SocketHandler } from "../templates/socket.template.js";
import { SocketIOSocket } from "./sockets/socketio.socket.js";

export type SocketDriver = "socketio";

class SocketManager {
    private drivers: Map<SocketDriver, SocketTemplate> = new Map();

    constructor() {
        this.drivers.set("socketio", new SocketIOSocket());
        // this.drivers.set("ws", new WSSocket());
    }

    // ── Resolve ───────────────────────────────────────────────────────────────

    private resolve(driver: SocketDriver): SocketTemplate {
        const socket = this.drivers.get(driver);
        if (!socket) throw new Error(`[SocketManager] Unknown driver: "${driver}"`);
        if (!socket.isConnected()) throw new Error(`[SocketManager] Driver "${driver}" is not connected.`);
        return socket;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async connect(driver: SocketDriver, server: HttpServer): Promise<void> {
        const socket = this.drivers.get(driver);
        if (!socket) throw new Error(`[SocketManager] Unknown driver: "${driver}"`);
        await socket.connect(server);
    }

    async disconnect(driver: SocketDriver): Promise<void> {
        await this.drivers.get(driver)?.disconnect();
    }

    // ── Socket API ────────────────────────────────────────────────────────────

    emit(driver: SocketDriver, socketId: string, event: string, data: unknown): SocketResult {
        return this.resolve(driver).emit(socketId, event, data);
    }

    broadcast(driver: SocketDriver, event: string, data: unknown): SocketResult {
        return this.resolve(driver).broadcast(event, data);
    }

    toRoom(driver: SocketDriver, room: string, event: string, data: unknown): SocketResult {
        return this.resolve(driver).toRoom(room, event, data);
    }

    async join(driver: SocketDriver, socketId: string, room: string): Promise<RoomResult> {
        return this.resolve(driver).join(socketId, room);
    }

    async leave(driver: SocketDriver, socketId: string, room: string): Promise<RoomResult> {
        return this.resolve(driver).leave(socketId, room);
    }

    async roomCount(driver: SocketDriver, room: string): Promise<number> {
        return this.resolve(driver).roomCount(room);
    }

    async rooms(driver: SocketDriver, socketId: string): Promise<string[]> {
        return this.resolve(driver).rooms(socketId);
    }

    on<T>(driver: SocketDriver, event: string, handler: SocketHandler<T>): void {
        this.resolve(driver).on(event, handler);
    }

    off(driver: SocketDriver, event: string): void {
        this.resolve(driver).off(event);
    }

    connectedCount(driver: SocketDriver): number {
        return this.resolve(driver).connectedCount();
    }

    connectedIds(driver: SocketDriver): string[] {
        return this.resolve(driver).connectedIds();
    }
}

export default new SocketManager();