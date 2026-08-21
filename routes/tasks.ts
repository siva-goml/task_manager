import express, { Request, Response } from "express";

import { requireAuth } from "../helpers";
import Task from "../models/Task";

const router = express.Router();

router.get("/tasks", requireAuth, async (_req: Request, res: Response): Promise<void> => {
    const tasks = await Task.find();
    res.json(tasks);
});

router.post("/tasks", requireAuth, async (req: Request, res: Response): Promise<void> => {
    const { title, done } = req.body ?? {};
    if (!title) {
        res.status(400).json({ message: "Title is required" });
        return;
    }
    const task = await Task.create({ title, done });
    res.status(201).json(task);
});

router.put("/tasks/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
    const { title, done } = req.body ?? {};
    const task = await Task.findByIdAndUpdate(
        req.params.id,
        { title, done },
        { new: true, runValidators: true }
    );
    if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
    }
    res.json(task);
});

router.delete("/tasks/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
    }
    res.json({ message: "Task deleted successfully" });
});

export default router;