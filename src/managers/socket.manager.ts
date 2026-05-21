import { Server as HttpServer } from "http";
import { SocketTemplate, SocketResult, RoomResult, SocketHandler } from "../templates/socket.template.js";
import { SocketIOSocket } from "./sockets/socketio.socket.js";
import { ManagerTemplate } from "../templates/manager.template.js";

export type SocketDriver = "socketio";

class SocketManager extends ManagerTemplate<SocketDriver, SocketTemplate> {
    protected label = "SocketManager";

    constructor() {
        super();
        this.drivers.set("socketio", new SocketIOSocket());
    }

    async connect(driver: SocketDriver, server: HttpServer): Promise<void> {
        const socket = this.drivers.get(driver);
        if (!socket) throw new Error(`[${this.label}] Unknown driver: "${driver}"`);
        try {
            await socket.connect(server);
            this.clearError(driver);
        } catch (err) {
            this.setError(driver, err as Error);
            console.warn(`[${this.label}] Could not connect "${driver}":`, err);
        }
    }

    // ── Socket API (all sync, use resolveSync) ────────────────────────────────

    emit(driver: SocketDriver, socketId: string, event: string, data: unknown): SocketResult {
        return this.resolveSync(driver).emit(socketId, event, data);
    }

    broadcast(driver: SocketDriver, event: string, data: unknown): SocketResult {
        return this.resolveSync(driver).broadcast(event, data);
    }

    toRoom(driver: SocketDriver, room: string, event: string, data: unknown): SocketResult {
        return this.resolveSync(driver).toRoom(room, event, data);
    }

    async join(driver: SocketDriver, socketId: string, room: string): Promise<RoomResult> {
        return this.resolveSync(driver).join(socketId, room);
    }

    async leave(driver: SocketDriver, socketId: string, room: string): Promise<RoomResult> {
        return this.resolveSync(driver).leave(socketId, room);
    }

    async roomCount(driver: SocketDriver, room: string): Promise<number> {
        return this.resolveSync(driver).roomCount(room);
    }

    async rooms(driver: SocketDriver, socketId: string): Promise<string[]> {
        return this.resolveSync(driver).rooms(socketId);
    }

    on<T>(driver: SocketDriver, event: string, handler: SocketHandler<T>): void {
        this.resolveSync(driver).on(event, handler);
    }

    off(driver: SocketDriver, event: string): void {
        this.resolveSync(driver).off(event);
    }

    connectedCount(driver: SocketDriver): number {
        return this.resolveSync(driver).connectedCount();
    }

    connectedIds(driver: SocketDriver): string[] {
        return this.resolveSync(driver).connectedIds();
    }
}

export default new SocketManager();