const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");

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

module.exports = app;
