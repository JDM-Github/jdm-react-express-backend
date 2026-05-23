import Config from "../configs/env.config.js";
import SocketManager from "../managers/socket.manager.js";
import type { SocketDriver } from "../managers/socket.manager.js";

const TARGET_SOCKET = Config.TARGET_SOCKET as SocketDriver;

class SocketService {

    // ── Info ──────────────────────────────────────────────────────────────────

    public async getSocketInfo() {
        try {
            const count = SocketManager.connectedCount(TARGET_SOCKET);
            const ids = SocketManager.connectedIds(TARGET_SOCKET);
            return { connectedCount: count, connectedIds: ids, error: null };
        } catch (err) {
            return { connectedCount: 0, connectedIds: [], error: (err as Error).message };
        }
    }

    // ── Emit ──────────────────────────────────────────────────────────────────

    public async postEmit(body: unknown) {
        const { socketId, event, data } = body as { socketId: string; event: string; data: unknown };
        if (!socketId) return { event: null, data: null, error: "socketId is required" };
        if (!event) return { event: null, data: null, error: "event is required" };
        if (!data) return { event: null, data: null, error: "data is required" };
        return SocketManager.emit(TARGET_SOCKET, socketId, event, data);
    }

    public async postBroadcast(body: unknown) {
        const { event, data } = body as { event: string; data: unknown };
        if (!event) return { event: null, data: null, error: "event is required" };
        if (!data) return { event: null, data: null, error: "data is required" };
        return SocketManager.broadcast(TARGET_SOCKET, event, data);
    }

    // ── Rooms ─────────────────────────────────────────────────────────────────

    public async postEmitRoom(body: unknown) {
        const { room, event, data } = body as { room: string; event: string; data: unknown };
        if (!room) return { event: null, data: null, error: "room is required" };
        if (!event) return { event: null, data: null, error: "event is required" };
        if (!data) return { event: null, data: null, error: "data is required" };
        return SocketManager.toRoom(TARGET_SOCKET, room, event, data);
    }

    public async postJoinRoom(body: unknown) {
        const { socketId, room } = body as { socketId: string; room: string };
        if (!socketId) return { socketId: null, room: null, error: "socketId is required" };
        if (!room) return { socketId: null, room: null, error: "room is required" };
        return SocketManager.join(TARGET_SOCKET, socketId, room);
    }

    public async postLeaveRoom(body: unknown) {
        const { socketId, room } = body as { socketId: string; room: string };
        if (!socketId) return { socketId: null, room: null, error: "socketId is required" };
        if (!room) return { socketId: null, room: null, error: "room is required" };
        return SocketManager.leave(TARGET_SOCKET, socketId, room);
    }

    public async getRoomCount(room: string) {
        if (!room) return { room: null, count: 0, error: "room is required" };
        const count = await SocketManager.roomCount(TARGET_SOCKET, room);
        return { room, count, error: null };
    }

    public async getSocketRooms(socketId: string) {
        if (!socketId) return { socketId: null, rooms: [], error: "socketId is required" };
        const rooms = await SocketManager.rooms(TARGET_SOCKET, socketId);
        return { socketId, rooms, error: null };
    }

    // ── Events ────────────────────────────────────────────────────────────────

    public async postRegisterEvent(body: unknown) {
        const { event } = body as { event: string };
        if (!event) return { event: null, registered: false, error: "event is required" };
        SocketManager.on(TARGET_SOCKET, event, (data) => {
            console.log(`[SocketService] Event "${event}" received:`, data);
        });
        return { event, registered: true, error: null };
    }

    public async deleteUnregisterEvent(event: string) {
        if (!event) return { event: null, unregistered: false, error: "event is required" };
        SocketManager.off(TARGET_SOCKET, event);
        return { event, unregistered: true, error: null };
    }
}

export default new SocketService();