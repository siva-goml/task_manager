const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, readUsers, writeUsers} = require("../helpers");

const router = express.Router();

router.post("/register", async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    const users = readUsers();
    const existingUser = users.find(user => user.username === username);

    if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
    }

    const newUser = {
        id: users.length + 1,
        username,
        password: await bcrypt.hash(password, 10)
    };

    users.push(newUser);
    writeUsers(users);

    res.status(201).json({
        message: "User registered successfully",
        user: { id: newUser.id, username: newUser.username }
    });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};
    const user = readUsers().find(item => item.username === username);

    if (!user || !password || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
});

module.exports = router;