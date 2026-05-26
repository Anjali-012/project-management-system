const createNotification = require("../utils/createNotification");
const Task = require("../models/task.model");
const Project = require("../models/project.model");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const logActivity = require("../utils/logActivity");

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

  await logActivity({
    project: projectId,
    user: req.user.userId,
    action: "TASK_CREATED",
    metadata: {
      taskId: task._id,
      title: task.title,
    },
  });

  if (assignedTo) {
    await createNotification({
      user: assignedTo,
      message: `You were assigned a new task: ${task.title}`,
      type: "TASK_ASSIGNED",
    });
  }

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: task,
  });
});

const getTasks = asyncHandler(async (req, res) => {
  const {
    projectId,
    status,
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
  } = req.query;

  // filter object
 const filter = {
  isDeleted: false,
};

  if (projectId) {
    filter.project = projectId;
  }

  if (status) {
    filter.status = status;
  }

  // search by title
  if (search) {
    filter.title = {
      $regex: search,
      $options: "i",
    };
  }

  // pagination
  const skip = (page - 1) * limit;

  // sorting
  const sortOptions = {
    [sortBy]: order === "asc" ? 1 : -1,
  };

  // fetch tasks
  const tasks = await Task.find(filter)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("project", "title")
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit));

  // total count
  const totalTasks = await Task.countDocuments(filter);

  res.status(200).json({
    success: true,
    currentPage: Number(page),
    totalPages: Math.ceil(totalTasks / limit),
    totalTasks,
    count: tasks.length,
    data: tasks,
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findOne({
  _id: id,
  isDeleted: false,
});

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

  await logActivity({
    project: task.project,
    user: req.user.userId,
    action: "TASK_UPDATED",
    metadata: { taskId: task._id },
  });

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    data: updatedTask,
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findOne({
  _id: id,
  isDeleted: false,
});

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const isTaskCreator = task.createdBy.toString() === req.user.userId;

  const isAdmin = req.user.role === "admin";

  if (!isTaskCreator && !isAdmin) {
    throw new ApiError(403, "You are not allowed to delete this task");
  }

  task.isDeleted = true;
task.deletedAt = new Date();

await task.save();

  await logActivity({
    project: task.project,
    user: req.user.userId,
    action: "TASK_DELETED",
    metadata: { taskId: task._id },
  });

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
