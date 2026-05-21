const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");

const { protect } = require("../middlewares/auth.middleware");

// create task
router.post("/", protect, createTask);

// get tasks
router.get("/", protect, getTasks);

// update task
router.put("/:id", protect, updateTask);

// delete task
router.delete("/:id", protect, deleteTask);

module.exports = router;
