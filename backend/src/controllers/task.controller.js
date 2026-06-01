const asyncHandler = require("../utils/asyncHandler");
const taskService = require("../services/task.service");
const { emitToProject } = require("../sockets");

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({
    payload: req.body,
    userId: req.user.userId,
    project: req.project,
  });

  emitToProject(task.project._id || task.project, "task:created", task);

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: task,
  });
});

const getTasks = asyncHandler(async (req, res) => {
  const { tasks, totalTasks, currentPage, totalPages } = await taskService.getTasks(
    req.query,
  );

  res.status(200).json({
    success: true,
    currentPage,
    totalPages,
    totalTasks,
    count: tasks.length,
    data: tasks,
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const updatedTask = await taskService.updateTask({
    task: req.task,
    payload: req.body,
    userId: req.user.userId,
    project: req.project,
  });

  emitToProject(
    updatedTask.project._id || updatedTask.project,
    "task:updated",
    updatedTask,
  );

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    data: updatedTask,
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask({
    task: req.task,
    user: req.user,
  });

  emitToProject(task.project, "task:deleted", { id: task._id, project: task.project });

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
