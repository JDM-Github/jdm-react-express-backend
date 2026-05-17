import { Router } from "express";
import { getTest, postTest } from "../controllers/test.controller";

export const testRouter = Router();

testRouter.get("/", getTest);
testRouter.post("/", postTest);