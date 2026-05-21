import type { Request, Response } from "express";
import { success, error } from "../utils/responses.js";
import SocketService from "../services/socket.service.js";

// ── Info ──────────────────────────────────────────────────────────────────────

export const getSocketInfo = async (_req: Request, res: Response) => {
    try {
        const data = await SocketService.getSocketInfo();
        if (data.error) return error(res, data.error, 500);
        return success(res, data, "Socket info fetched successfully");
    } catch (err) {
        return error(res, "Failed to get socket info", 500, err);
    }
};

// ── Emit ──────────────────────────────────────────────────────────────────────

export const postEmit = async (req: Request, res: Response) => {
    try {
        const data = await SocketService.postEmit(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Emitted successfully");
    } catch (err) {
        return error(res, "Failed to emit", 500, err);
    }
};

export const postBroadcast = async (req: Request, res: Response) => {
    try {
        const data = await SocketService.postBroadcast(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Broadcasted successfully");
    } catch (err) {
        return error(res, "Failed to broadcast", 500, err);
    }
};

// ── Rooms ─────────────────────────────────────────────────────────────────────

export const postEmitRoom = async (req: Request, res: Response) => {
    try {
        const data = await SocketService.postEmitRoom(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Emitted to room successfully");
    } catch (err) {
        return error(res, "Failed to emit to room", 500, err);
    }
};

export const postJoinRoom = async (req: Request, res: Response) => {
    try {
        const data = await SocketService.postJoinRoom(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Joined room successfully");
    } catch (err) {
        return error(res, "Failed to join room", 500, err);
    }
};

export const postLeaveRoom = async (req: Request, res: Response) => {
    try {
        const data = await SocketService.postLeaveRoom(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Left room successfully");
    } catch (err) {
        return error(res, "Failed to leave room", 500, err);
    }
};

export const getRoomCount = async (req: Request, res: Response) => {
    try {
        const data = await SocketService.getRoomCount(req.params.room as string);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Room count fetched successfully");
    } catch (err) {
        return error(res, "Failed to get room count", 500, err);
    }
};

export const getSocketRooms = async (req: Request, res: Response) => {
    try {
        const data = await SocketService.getSocketRooms(req.params.socketId as string);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Socket rooms fetched successfully");
    } catch (err) {
        return error(res, "Failed to get socket rooms", 500, err);
    }
};

// ── Events ────────────────────────────────────────────────────────────────────

export const postRegisterEvent = async (req: Request, res: Response) => {
    try {
        const data = await SocketService.postRegisterEvent(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Event registered successfully");
    } catch (err) {
        return error(res, "Failed to register event", 500, err);
    }
};

export const deleteUnregisterEvent = async (req: Request, res: Response) => {
    try {
        const data = await SocketService.deleteUnregisterEvent(req.params.event as string);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Event unregistered successfully");
    } catch (err) {
        return error(res, "Failed to unregister event", 500, err);
    }
};