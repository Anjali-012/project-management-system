const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const {
  getMyNotifications,
} = require("../controllers/notification.controller");

router.get("/", protect, getMyNotifications);

module.exports = router;
