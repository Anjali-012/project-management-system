const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const taskRoutes = require("./routes/task.routes");

const errorMiddleware = require("./middlewares/error.middleware");
const activityRoutes = require("./routes/activity.routes");
const notificationRoutes = require("./routes/notification.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const userRoutes = require("./routes/user.routes");
const externalRoutes = require("./routes/external.routes");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// test route
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is healthy 🚀",
  });
});

// auth routes
app.use("/api/auth", authRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/tasks", taskRoutes);

app.use("/api/activity", activityRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/users", userRoutes);

app.use("/api/external", externalRoutes);

// global error middleware
app.use(errorMiddleware);

module.exports = app;
