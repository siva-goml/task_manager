import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

export interface AuthenticatedRequest extends Request {
    user?: jwt.JwtPayload | string;
}

export const JWT_SECRET = process.env.JWT_SECRET ?? "";

export function requireAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    const authorization = req.headers.authorization;
    const token = authorization && authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : null;

    if (!token) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
}