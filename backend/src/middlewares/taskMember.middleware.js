const Task = require("../models/task.model");
const Project = require("../models/project.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const isTaskMember = asyncHandler(async (req, res, next) => {
  const taskId = req.params.id;

  const task = await Task.findOne({
    _id: taskId,
    isDeleted: false,
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const project = await Project.findById(task.project);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const isMember = project.members.some(
    (memberId) => memberId.toString() === req.user.userId,
  );

  if (!isMember) {
    throw new ApiError(403, "You are not allowed to access this task");
  }

  req.task = task;
  req.project = project;

  next();
});

module.exports = isTaskMember;
