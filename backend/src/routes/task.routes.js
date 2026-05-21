const express = require("express");
const router = express.Router();

const { createTask, getTasks } = require("../controllers/task.controller");

const { protect } = require("../middlewares/auth.middleware");

// create task
router.post("/", protect, createTask);

// get tasks
router.get("/", protect, getTasks);

module.exports = router;
