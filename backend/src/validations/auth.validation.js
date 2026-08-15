const { body } = require("express-validator");

const registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),

  body("email").isEmail().withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),

  body("password").notEmpty().withMessage("Password is required"),
];

const createManagedUserValidation = [
  ...registerValidation,
  body("role").optional().isIn(["admin", "manager", "member"])
    .withMessage("Role must be admin, manager, or member"),
];

module.exports = {
  registerValidation,
  loginValidation,
  createManagedUserValidation,
};
