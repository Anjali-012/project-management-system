const Activity = require("../models/activity.model");
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

module.exports = {
  getProjectActivity,
};
