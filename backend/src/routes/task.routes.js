const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");

const { protect } = require("../middlewares/auth.middleware");

const validate = require("../middlewares/validation.middleware");

const {
  createTaskValidation,
  updateTaskValidation,
} = require("../validations/task.validation");

// create task
router.post("/", protect, createTaskValidation, validate, createTask);

// get tasks
router.get("/", protect, getTasks);

// update task
router.patch("/:id", protect, updateTaskValidation, validate, updateTask);

// delete task
router.delete("/:id", protect, deleteTask);

module.exports = router;
