const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { getDashboard } = require("../controllers/dashboard.controller");

router.get("/", protect, getDashboard);

module.exports = router;
