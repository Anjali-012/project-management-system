const { body, query } = require("express-validator");

const TASK_STATUSES = ["todo", "in-progress", "done"];
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];
const TASK_SORT_FIELDS = ["createdAt", "updatedAt", "title", "dueDate", "priority", "status"];
const STATUS_ALIASES = { pending: "todo", in_progress: "in-progress", completed: "done" };

const createTaskValidation = [
  body("title").notEmpty().withMessage("Task title is required"),
  body("projectId").isMongoId().withMessage("Valid project ID is required"),
  body("status").optional().isIn(TASK_STATUSES).withMessage("Invalid task status"),
  body("priority").optional().isIn(TASK_PRIORITIES).withMessage("Invalid priority"),
  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("Invalid due date"),
];

const updateTaskValidation = [
  body("status").optional().isIn(TASK_STATUSES).withMessage("Invalid task status"),
  body("priority").optional().isIn(TASK_PRIORITIES).withMessage("Invalid priority"),
  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("Invalid due date"),
  body("projectId").optional().isMongoId().withMessage("Valid project ID is required"),
];

const addCommentValidation = [
  body("text").trim().notEmpty().withMessage("Comment text is required")
    .isLength({ max: 1000 }).withMessage("Comment must be 1000 characters or less"),
];

const listTasksValidation = [
  query("projectId").optional().isMongoId().withMessage("Valid project ID is required"),
  query("status").optional().customSanitizer((value) => STATUS_ALIASES[value] || value)
    .isIn(TASK_STATUSES).withMessage("Invalid task status"),
  query("priority").optional().isIn(TASK_PRIORITIES).withMessage("Invalid priority"),
  query("assignedTo").optional().isMongoId().withMessage("Valid assignee ID is required"),
  query("assignee").optional().isMongoId().withMessage("Valid assignee ID is required"),
  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search must be 100 characters or less"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("sortBy").optional().isIn(TASK_SORT_FIELDS).withMessage("Invalid sort field"),
  query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("Sort order must be asc or desc"),
  query("order").optional().isIn(["asc", "desc"]).withMessage("Sort order must be asc or desc"),
];

module.exports = { createTaskValidation, updateTaskValidation, addCommentValidation, listTasksValidation };
