import type { Request, Response } from "express";
import { success, error } from "../utils/responses.js";
import PersonService from "../services/person.service.js";

export const getAllPersons = async (_: Request, res: Response) => {
    try {
        const result = await PersonService.fetchAll();
        if (result.error) return error(res, result.error, 500);
        return success(res, result.data, `Fetched ${result.count} person(s)`);
    } catch (err) {
        return error(res, "Failed to fetch persons", 500, err);
    }
};

export const getPersonToken = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        if (!id) return error(res, "id is required", 400);

        const result = await PersonService.getTokenById(id);
        if (result.error) return error(res, result.error, 404);

        return success(res, { token: result.token }, "Token generated");
    } catch (err) {
        return error(res, "Failed to generate token", 500, err);
    }
};