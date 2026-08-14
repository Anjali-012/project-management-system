const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const isProjectMember = require("../middlewares/projectMember.middleware");

const { getAllActivity, getProjectActivity } = require("../controllers/activity.controller");

router.get("/", protect, getAllActivity);
router.get("/:projectId", protect, isProjectMember, getProjectActivity);

module.exports = router;
