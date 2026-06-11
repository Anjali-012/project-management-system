const Notification = require("../models/notification.model");

const createNotification = async ({ user, message, type, project = null }) => {
  try {
    await Notification.create({ user, message, type, project });
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};

module.exports = createNotification;
