require("dotenv").config();
const express = require("express");
const authRouter = require("./routes/auth");
const taskRouter = require("./routes/tasks");

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use(authRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
