import type { Request, Response, NextFunction } from "express";
import { error } from "../utils/responses.js";

export const require_access = (
    req: Request,
    res: Response,
    next: NextFunction
): Response | void => {
    const authHeader = req.headers["x-auth-token"];

    if (!authHeader || typeof authHeader !== "string") {
        return error(res, "Missing X-Auth-Token header", 401);
    }

    if (!authHeader.startsWith("Bearer ")) {
        return error(res, "Invalid X-Auth-Token format", 401);
    }

    const token = authHeader.split(" ")[1]?.trim();
    const expected = process.env.API_ACCESS;

    if (!expected) {
        return error(
            res,
            "Server is not configured with an API access token",
            500
        );
    }

    if (token !== expected) {
        return error(res, "Unauthorized", 401);
    }

    next();
};