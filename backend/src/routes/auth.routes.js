const express = require("express");
const router = express.Router();

const { registerUser, loginUser } = require("../controllers/auth.controller");
const { protect, authorizeRoles } = require("../middlewares/auth.middleware");

const validate = require("../middlewares/validation.middleware");

const {
  registerValidation,
  loginValidation,
} = require("../validations/auth.validation");

// public routes
router.post("/register", registerValidation, validate, registerUser);
router.post("/login", loginValidation, validate, loginUser);

// protected routes
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin 🚀",
  });
});

module.exports = router;
