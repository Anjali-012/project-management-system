const mongoose = require("mongoose");

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    role: {
      type: String,
      enum: ["owner", "manager", "member", "viewer"],
      required: true,
      default: "member",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // joinedAt is the canonical join timestamp
  },
);

// Enforce one record per user per project
projectMemberSchema.index({ user: 1, project: 1 }, { unique: true });

// Fast lookup of all members in a project
projectMemberSchema.index({ project: 1 });

// Fast lookup of all projects a user belongs to
projectMemberSchema.index({ user: 1 });

const ProjectMember = mongoose.model("ProjectMember", projectMemberSchema);

module.exports = ProjectMember;
