const { body, param } = require("express-validator");

const ASSIGNABLE_ROLES = ["manager", "member", "viewer"];

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
  body("role")
    .optional()
    .isIn(ASSIGNABLE_ROLES)
    .withMessage(`Role must be one of: ${ASSIGNABLE_ROLES.join(", ")}`),
];

const changeMemberRoleValidation = [
  param("projectId").isMongoId().withMessage("Valid project ID is required"),
  param("userId").isMongoId().withMessage("Valid user ID is required"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(ASSIGNABLE_ROLES)
    .withMessage(`Role must be one of: ${ASSIGNABLE_ROLES.join(", ")}`),
];

const removeMemberValidation = [
  param("projectId").isMongoId().withMessage("Valid project ID is required"),
  param("userId").isMongoId().withMessage("Valid user ID is required"),
];

module.exports = {
  createProjectValidation,
  addMemberValidation,
  changeMemberRoleValidation,
  removeMemberValidation,
};
