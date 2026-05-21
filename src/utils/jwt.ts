import jwt from "jsonwebtoken";

export interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export const signToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: "7d",
    });
};

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
};