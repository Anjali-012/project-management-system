const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const isProjectMember = require("../middlewares/projectMember.middleware");

const { getProjectActivity } = require("../controllers/activity.controller");

router.get("/:projectId", protect, isProjectMember, getProjectActivity);

module.exports = router;
