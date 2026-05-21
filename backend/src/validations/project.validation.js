const { body, param } = require("express-validator");

const createProjectValidation = [
  body("title")
    .notEmpty()
    .withMessage("Project title is required")
    .isLength({ min: 3 })
    .withMessage("Project title must be at least 3 characters"),
];

const addMemberValidation = [
  param("projectId").isMongoId().withMessage("Valid project ID is required"),

  body("email").isEmail().withMessage("Valid email is required"),
];

module.exports = {
  createProjectValidation,
  addMemberValidation,
};
