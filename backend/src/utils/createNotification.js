const Notification = require("../models/notification.model");

const createNotification = async ({ user, message, type }) => {
  try {
    await Notification.create({
      user,
      message,
      type,
    });
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};

module.exports = createNotification;
