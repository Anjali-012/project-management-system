const Task = require("../models/task.model");
const Project = require("../models/project.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const createTask = asyncHandler(async (req, res) => {
  const { title, description, projectId, assignedTo } = req.body;

  // check project exists
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const task = await Task.create({
    title,
    description,
    project: projectId,
    assignedTo,
    createdBy: req.user.userId,
  });

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: task,
  });
});

const getTasks = asyncHandler(async (req, res) => {
  const { projectId, status } = req.query;

  const filter = {};

  if (projectId) {
    filter.project = projectId;
  }

  if (status) {
    filter.status = status;
  }

  const tasks = await Task.find(filter)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("project", "title");

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const updatedTask = await Task.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("project", "title");

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    data: updatedTask,
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const isTaskCreator = task.createdBy.toString() === req.user.userId;

  const isAdmin = req.user.role === "admin";

  if (!isTaskCreator && !isAdmin) {
    throw new ApiError(403, "You are not allowed to delete this task");
  }

  await task.deleteOne();

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
});

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
};
