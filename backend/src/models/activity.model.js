const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "TASK_CREATED",
        "TASK_UPDATED",
        "TASK_STATUS_UPDATED",
        "TASK_DELETED",
        "COMMENT_ADDED",
        "MEMBER_ADDED",
        "PROJECT_CREATED",
        "EMAIL_SENT",
        "EMAIL_FAILED",
      ],
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Activity", activitySchema);
