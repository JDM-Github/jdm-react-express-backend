import type { Request, Response } from "express";

export const getTest = (_req: Request, res: Response) => {
    res.json({
        success: true,
        message: "GET /api/test works",
        data: { timestamp: new Date().toISOString() },
    });
};

export const postTest = (req: Request, res: Response) => {
    const body: unknown = req.body;

    res.status(201).json({
        success: true,
        message: "POST /api/test works",
        received: body,
    });
};