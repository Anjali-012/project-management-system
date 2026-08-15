const express = require("express");
const router = express.Router();
const { createTask, getTasks, getTask, getComments, getTaskActivity, updateTask, deleteTask, addComment } = require("../controllers/task.controller");
const { protect } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { createTaskValidation, updateTaskValidation, addCommentValidation, listTasksValidation } = require("../validations/task.validation");
const isProjectMember = require("../middlewares/projectMember.middleware");
const isTaskMember = require("../middlewares/taskMember.middleware");
const requireProjectPermission = require("../middlewares/requireProjectPermission.middleware");

router.post("/", protect, createTaskValidation, validate, isProjectMember, requireProjectPermission("task:create"), createTask);
router.get("/", protect, listTasksValidation, validate, getTasks);
router.get("/:id", protect, isTaskMember, getTask);
router.get("/:id/comments", protect, isTaskMember, getComments);
router.get("/:id/activity", protect, isTaskMember, getTaskActivity);
router.patch("/:id", protect, isTaskMember, updateTaskValidation, validate, updateTask);
router.put("/:id", protect, isTaskMember, updateTaskValidation, validate, updateTask);
router.delete("/:id", protect, isTaskMember, deleteTask);
router.post("/:id/comments", protect, isTaskMember, addCommentValidation, validate, addComment);

module.exports = router;
