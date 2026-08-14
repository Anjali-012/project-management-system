const Activity = require("../models/activity.model");
const Project = require("../models/project.model");
const asyncHandler = require("../utils/asyncHandler");

const getProjectActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ project: req.project._id })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities,
  });
});

// GET /api/activity — all projects the authenticated user is a member of
const getAllActivity = asyncHandler(async (req, res) => {
  const projects = await Project.find({ members: req.user.userId }, "_id").lean();
  const projectIds = projects.map((p) => p._id);

  const activities = await Activity.find({ project: { $in: projectIds } })
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities,
  });
});

module.exports = {
  getAllActivity,
  getProjectActivity,
};
