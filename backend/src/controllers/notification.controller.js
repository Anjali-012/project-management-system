const Notification = require("../models/notification.model");
const asyncHandler = require("../utils/asyncHandler");

const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    user: req.user.userId,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
});

module.exports = { getMyNotifications };
