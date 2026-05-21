import type { Request, Response, NextFunction } from "express";

import { error } from "../utils/responses.js";

export const authorize =
    (...roles: string[]) =>
        (
            req: Request,
            res: Response,
            next: NextFunction
        ): Response | void => {
            if (!req.user) {
                return error(res, "Unauthorized", 401);
            }

            if (!roles.includes(req.user.role)) {
                return error(res, "Forbidden", 403);
            }

            next();
        };