const Notification = require("../models/notification.model");
const Project = require("../models/project.model");
const asyncHandler = require("../utils/asyncHandler");

const getMyNotifications = asyncHandler(async (req, res) => {
  const userProjects = await Project.find({ members: req.user.userId }).select("_id");
  const projectIds = userProjects.map((p) => p._id);

  // show notifications that are either scoped to a project the user belongs to,
  // or have no project (system-level, e.g. PROJECT_MEMBER_ADDED)
  const notifications = await Notification.find({
    user: req.user.userId,
    $or: [{ project: { $in: projectIds } }, { project: null }],
  })
    .sort({ createdAt: -1 })
    .limit(20);

  res.status(200).json({ success: true, count: notifications.length, data: notifications });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.userId, isRead: false },
    { isRead: true },
  );
  res.status(200).json({ success: true });
});

module.exports = { getMyNotifications, markAllRead };
