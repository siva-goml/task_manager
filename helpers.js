const fs = require("fs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function readTasks() {
    const data = fs.readFileSync("tasks.json", "utf-8");
    return JSON.parse(data);
}

function readUsers() {
    const data = fs.readFileSync("users.json", "utf-8");
    return JSON.parse(data);
}

function writeTasks(tasks) {
    fs.writeFileSync(
        "tasks.json",
        JSON.stringify(tasks, null, 2)
    );
}

function writeUsers(users) {
    fs.writeFileSync(
        "users.json",
        JSON.stringify(users, null, 2)
    );
}

function requireAuth(req, res, next) {
    const authorization = req.headers.authorization;
    const token = authorization && authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

module.exports = { JWT_SECRET, readTasks, readUsers, writeTasks, writeUsers, requireAuth};

