import multer from "multer";
import { Request, Response, NextFunction } from "express";

const single = (fieldName = "file") =>
    multer({ storage: multer.memoryStorage() }).single(fieldName);

const array = (fieldName = "files", maxCount = 10) =>
    multer({ storage: multer.memoryStorage() }).array(fieldName, maxCount);

const fields = (fieldConfigs: { name: string; maxCount?: number }[]) =>
    multer({ storage: multer.memoryStorage() }).fields(fieldConfigs);

// Guards
const requireFile = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
    }
    next();
};

const requireFiles = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({ success: false, message: "No files uploaded" });
        return;
    }
    next();
};

export const Upload = {
    single,
    array,
    fields,
    requireFile,
    requireFiles,
};