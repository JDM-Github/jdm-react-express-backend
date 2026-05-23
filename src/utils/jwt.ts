import Config from "../configs/env.config.js";
import jwt from "jsonwebtoken";

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

export const signToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, Config.JWT_SECRET, {
        expiresIn: "7d",
    });
};

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, Config.JWT_SECRET) as JwtPayload;
};