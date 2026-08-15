const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const { getExternalUsers } = require("../controllers/external.controller");

const router = express.Router();
router.get("/users", protect, getExternalUsers);

module.exports = router;
