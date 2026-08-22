import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../helpers";
import User from "../models/User";

const router = express.Router();
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? "";
const isProduction = process.env.NODE_ENV === "production";

const accessTokenCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    maxAge: 15 * 60 * 1000
};

const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000
};

router.post("/register", async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
        res.status(400).json({ message: "Username and password are required" });
        return;
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        res.status(409).json({ message: "Username already exists" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json({
        message: "User registered successfully",
        user: { id: user._id, username: user.username }
    });
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body ?? {};
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ message: "Invalid username or password" });
        return;
    }

    const token = jwt.sign(
        { userId: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign({ userId: user._id }, refreshSecret, { expiresIn: "7d" });
    res.cookie("accessToken", token, accessTokenCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
    res.json({ message: "Login successful" });
});

router.post("/refresh", (req: Request, res: Response): void => {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    if (!refreshToken) {
        res.status(401).json({ message: "Refresh token required" });
        return;
    }

    try {
        const decoded = jwt.verify(refreshToken, refreshSecret);
        const userId = typeof decoded === "string" ? undefined : decoded.userId;
        const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });
        res.cookie("accessToken", accessToken, accessTokenCookieOptions);
        res.json({ message: "Access token refreshed" });
    } catch {
        res.status(401).json({ message: "Invalid or expired refresh token" });
    }
});

router.post("/logout", (_req: Request, res: Response): void => {
    res.clearCookie("accessToken", accessTokenCookieOptions);
    res.clearCookie("refreshToken", refreshTokenCookieOptions);
    res.json({ message: "Logged out successfully" });
});

export default router;