const Activity = require("../models/activity.model");

const logActivity = async ({ project, user, action, metadata = {} }) => {
  try {
    await Activity.create({
      project,
      user,
      action,
      metadata,
    });
  } catch (err) {
    console.error("Activity log failed:", err.message);
  }
};

module.exports = logActivity;
