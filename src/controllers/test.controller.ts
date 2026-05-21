import type { Request, Response } from "express";
import { success, error } from "../utils/responses.js";
import type { TestParams } from "../interface/index.js";
import TestService from "../services/test.service.js";

// ── Basic ─────────────────────────────────────────────────────────────────────

export const getTest = async (req: Request<TestParams>, res: Response) => {
    try {
        const data = await TestService.getTest(req.params.number, req.user);
        return success(res, data, "GET /api/test works");
    } catch (err) {
        return error(res, "Failed to fetch test data", 500, err);
    }
};

export const postTest = async (req: Request, res: Response) => {
    try {
        const data = await TestService.postTest(req.body, req.user);
        return success(res, data, "POST /api/test works", 201);
    } catch (err) {
        return error(res, "Failed to create test data", 500, err);
    }
};

// ── Email ─────────────────────────────────────────────────────────────────────

export const postEmail = async (req: Request, res: Response) => {
    try {
        const data = await TestService.postEmail(req.body, req.user);
        if (data.error) return error(res, data.error, 500);
        return success(res, data, "Email sent successfully");
    } catch (err) {
        return error(res, "Failed to send email", 500, err);
    }
};

// ── Storage ───────────────────────────────────────────────────────────────────

export const postUpload = async (req: Request, res: Response) => {
    try {
        const data = await TestService.postUpload(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Uploaded successfully");
    } catch (err) {
        return error(res, "Failed to upload", 500, err);
    }
};

export const postUploadFile = async (req: Request, res: Response) => {
    try {
        const data = await TestService.uploadFile(req.file!.buffer, req.file!.originalname, req.body.folder);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "File uploaded successfully");
    } catch (err) {
        return error(res, "Failed to upload file", 500, err);
    }
};

export const postUploadFiles = async (req: Request, res: Response) => {
    try {
        const data = await TestService.uploadFiles(req.files as Express.Multer.File[], req.body.folder);
        return success(res, data, `Uploaded ${data.length} file(s) successfully`);
    } catch (err) {
        return error(res, "Failed to upload files", 500, err);
    }
};

export const deleteUpload = async (req: Request, res: Response) => {
    try {
        const id = `${req.params.folder}/${req.params.id}`;
        const data = await TestService.deleteUpload(id);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Deleted successfully");
    } catch (err) {
        return error(res, "Failed to delete", 500, err);
    }
};

// ── Cache ─────────────────────────────────────────────────────────────────────

export const postCache = async (req: Request, res: Response) => {
    try {
        const data = await TestService.postCache(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Cache set successfully");
    } catch (err) {
        return error(res, "Failed to set cache", 500, err);
    }
};

export const getCache = async (req: Request, res: Response) => {
    try {
        const data = await TestService.getCache(req.params.key as string);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Cache fetched successfully");
    } catch (err) {
        return error(res, "Failed to get cache", 500, err);
    }
};

export const deleteCache = async (req: Request, res: Response) => {
    try {
        const data = await TestService.deleteCache(req.params.key as string);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Cache deleted successfully");
    } catch (err) {
        return error(res, "Failed to delete cache", 500, err);
    }
};

export const flushCache = async (_: Request, res: Response) => {
    try {
        const data = await TestService.flushCache();
        if (data.error) return error(res, data.error, 500);
        return success(res, data, "Cache flushed successfully");
    } catch (err) {
        return error(res, "Failed to flush cache", 500, err);
    }
};

// ── Queue ─────────────────────────────────────────────────────────────────────

export const postQueue = async (req: Request, res: Response) => {
    try {
        const data = await TestService.postQueue(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Job added to queue successfully");
    } catch (err) {
        return error(res, "Failed to add job", 500, err);
    }
};

export const getQueueStatus = async (req: Request, res: Response) => {
    try {
        const data = await TestService.getQueueStatus(req.params.queue as string, req.params.jobId as string);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Job status fetched successfully");
    } catch (err) {
        return error(res, "Failed to get job status", 500, err);
    }
};

export const deleteQueue = async (req: Request, res: Response) => {
    try {
        const data = await TestService.deleteQueue(req.params.queue as string, req.params.jobId as string);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Job removed successfully");
    } catch (err) {
        return error(res, "Failed to remove job", 500, err);
    }
};

// ── Socket ────────────────────────────────────────────────────────────────────

export const getSocket = async (_req: Request, res: Response) => {
    try {
        const data = await TestService.getSocket();
        if (data.error) return error(res, data.error, 500);
        return success(res, data, "Socket info fetched successfully");
    } catch (err) {
        return error(res, "Failed to get socket info", 500, err);
    }
};

export const postSocketBroadcast = async (req: Request, res: Response) => {
    try {
        const data = await TestService.postSocketBroadcast(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Broadcasted successfully");
    } catch (err) {
        return error(res, "Failed to broadcast", 500, err);
    }
};

export const postSocketEmit = async (req: Request, res: Response) => {
    try {
        const data = await TestService.postSocketEmit(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Emitted successfully");
    } catch (err) {
        return error(res, "Failed to emit", 500, err);
    }
};

export const postSocketRoom = async (req: Request, res: Response) => {
    try {
        const data = await TestService.postSocketRoom(req.body);
        if (data.error) return error(res, data.error, 400);
        return success(res, data, "Emitted to room successfully");
    } catch (err) {
        return error(res, "Failed to emit to room", 500, err);
    }
};