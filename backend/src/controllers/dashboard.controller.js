const asyncHandler = require("../utils/asyncHandler");
const Project = require("../models/project.model");
const Task = require("../models/task.model");
const Activity = require("../models/activity.model");

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

  const [tasks, activities] = await Promise.all([
    Task.find({ project: { $in: projectIds }, isDeleted: false })
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    Activity.find({ project: { $in: projectIds } })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ]);

  res.status(200).json({ success: true, data: { tasks, activities } });
});

module.exports = { getDashboard };
