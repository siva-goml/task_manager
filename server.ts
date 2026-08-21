import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth";
import taskRouter from "./routes/tasks";

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(authRouter);
app.use(taskRouter);

mongoose.connect(process.env.MONGO_URI ?? "")
    .then(() => console.log("Connected to MongoDB"))
    .catch((error: unknown) => console.error("MongoDB connection error:", error));

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});