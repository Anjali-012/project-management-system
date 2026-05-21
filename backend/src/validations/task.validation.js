const { body } = require("express-validator");

const createTaskValidation = [
  body("title").notEmpty().withMessage("Task title is required"),

  body("projectId").isMongoId().withMessage("Valid project ID is required"),

  body("status")
    .optional()
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid task status"),
];

const updateTaskValidation = [
  body("status")
    .optional()
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid task status"),

  body("projectId")
    .optional()
    .isMongoId()
    .withMessage("Valid project ID is required"),
];

module.exports = {
  createTaskValidation,
  updateTaskValidation,
};
