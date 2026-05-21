const express = require("express");
const router = express.Router();

const { registerUser, loginUser } = require("../controllers/auth.controller");
const { protect, authorizeRoles } = require("../middlewares/auth.middleware");

// public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

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
