import type { Response } from "express";
import { SuccessResponse, ErrorResponse } from "../interface/index.js";

export const success = <T>(
    res: Response,
    data: T | null = null,
    message = "OK",
    status = 200
): Response<SuccessResponse<T>> => {
    const response: SuccessResponse<T> = {
        success: true,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(status).json(response);
};

export const error = (
    res: Response,
    message = "Bad Request",
    status = 400,
    details: unknown = null
): Response<ErrorResponse> => {
    const response: ErrorResponse = {
        success: false,
        message,
    };

    if (details !== null) {
        response.details = details;
    }

    return res.status(status).json(response);
};