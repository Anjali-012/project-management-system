const { body } = require("express-validator");

const createTaskValidation = [
  body("title").notEmpty().withMessage("Task title is required"),
  body("projectId").isMongoId().withMessage("Valid project ID is required"),
  body("status").optional().isIn(["todo", "in-progress", "done"]).withMessage("Invalid task status"),
  body("priority").optional().isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("Invalid due date"),
];

const updateTaskValidation = [
  body("status").optional().isIn(["todo", "in-progress", "done"]).withMessage("Invalid task status"),
  body("priority").optional().isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("Invalid due date"),
  body("projectId").optional().isMongoId().withMessage("Valid project ID is required"),
];

const addCommentValidation = [
  body("text").trim().notEmpty().withMessage("Comment text is required")
    .isLength({ max: 1000 }).withMessage("Comment must be 1000 characters or less"),
];

module.exports = { createTaskValidation, updateTaskValidation, addCommentValidation };
