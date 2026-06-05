const Notification = require("../models/notification.model");
const asyncHandler = require("../utils/asyncHandler");

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.userId })
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
