const express = require("express");
const { readTasks, writeTasks, requireAuth} = require("../helpers");

const router = express.Router();

router.get("/tasks", requireAuth, (req, res) => {
    res.json(readTasks());
});

router.post("/tasks_create", requireAuth, (req, res) => {
    const { title, done = false } = req.body || {};

    if (!title) {
        return res.status(400).json({ message: "Title is required" });
    }

    const tasks = readTasks();
    const newTask = { id: tasks.length + 1, title, done };
    tasks.push(newTask);
    writeTasks(tasks);

    res.status(201).json(newTask);
});

router.put("/tasks/:id", requireAuth, (req, res) => {
    const tasks = readTasks();
    const task = tasks.find(item => item.id === Number(req.params.id));

    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }

    const { title, done } = req.body || {};
    if (title !== undefined) task.title = title;
    if (done !== undefined) task.done = done;

    writeTasks(tasks);
    res.json(task);
});

router.delete("/tasks/:id", requireAuth, (req, res) => {
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(item => item.id === Number(req.params.id));

    if (taskIndex === -1) {
        return res.status(404).json({ message: "Task not found" });
    }

    tasks.splice(taskIndex, 1);
    writeTasks(tasks);
    res.json({ message: "Task deleted successfully" });
});

module.exports = router;