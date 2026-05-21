import type { Request, Response, NextFunction } from "express";
import { error } from "../utils/responses.js";
import { verifyToken } from "../utils/jwt.js";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): Response | void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return error(res, "Missing Authorization header", 401);
    }

    if (!authHeader.startsWith("Bearer ")) {
        return error(res, "Invalid Authorization format", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch {
        return error(res, "Invalid or expired token", 401);
    }
};