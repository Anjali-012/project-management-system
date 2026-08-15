const asyncHandler = require("../utils/asyncHandler");
const Project = require("../models/project.model");
const Task = require("../models/task.model");
const Activity = require("../models/activity.model");
const mongoose = require("mongoose");

const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  // Resolve which projects to aggregate over
  let projectIds;
  if (req.query.projectId) {
    // Verify membership for the requested project
    const project = await Project.findOne({
      _id: req.query.projectId,
      members: userId,
    });
    if (!project) {
      return res.status(403).json({ success: false, message: "Project not found or access denied" });
    }
    projectIds = [project._id];
  } else {
    const projects = await Project.find({ members: userId }, "_id").lean();
    projectIds = projects.map((p) => p._id);
  }

  const taskFilter = { project: { $in: projectIds }, isDeleted: false };
  const [tasks, activities, statisticsResult] = await Promise.all([
    Task.find(taskFilter)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    Activity.find({ project: { $in: projectIds } })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Task.aggregate([
      { $match: taskFilter },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          pendingTasks: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
          inProgressTasks: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
          completedTasks: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
          overdueTasks: { $sum: { $cond: [{ $and: [{ $ne: ["$dueDate", null] }, { $lt: ["$dueDate", new Date()] }, { $ne: ["$status", "done"] }] }, 1, 0] } },
          myTasks: { $sum: { $cond: [{ $eq: ["$assignedTo", new mongoose.Types.ObjectId(userId)] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const statistics = statisticsResult[0] || {
    totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0, overdueTasks: 0, myTasks: 0,
  };
  delete statistics._id;

  // Flat fields make the assignment endpoint easy to consume; legacy data stays nested.
  res.status(200).json({ success: true, ...statistics, data: { tasks, activities, statistics } });
});

module.exports = { getDashboard };
