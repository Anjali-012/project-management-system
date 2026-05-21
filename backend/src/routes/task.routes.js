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

const isProjectMember = require("../middlewares/projectMember.middleware");
const isTaskMember = require("../middlewares/taskMember.middleware");

// create task
router.post(
  "/",
  protect,
  createTaskValidation,
  validate,
  isProjectMember,
  createTask,
);

// get tasks
router.get("/", protect, isProjectMember, getTasks);

// update task
router.patch(
  "/:id",
  protect,
  isTaskMember,
  updateTaskValidation,
  validate,
  updateTask,
);

// delete task
router.delete("/:id", protect, isTaskMember, deleteTask);

module.exports = router;
