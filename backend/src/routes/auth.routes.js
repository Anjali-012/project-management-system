const express = require("express");
const router = express.Router();

const { registerUser } = require("../controllers/auth.controller");

// register route
router.post("/register", registerUser);

module.exports = router;
