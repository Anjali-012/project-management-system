const asyncHandler = require("../utils/asyncHandler");
const taskService = require("../services/task.service");
const { emitToProject } = require("../sockets");
const db = require("../repositories/postgres.repository");

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask({
    payload: req.body,
    userId: req.user.userId,
    project: req.project,
    userRole: req.user.role,
  });
  emitToProject(task.project._id || task.project, "task:created", task);
  res.status(201).json({ success: true, message: "Task created successfully", data: task });
});

const getTasks = asyncHandler(async (req, res) => {
  const { tasks, totalTasks, currentPage, totalPages } = await taskService.getTasks({
    ...req.query,
    assignedTo: req.query.assignedTo || req.query.assignee,
    userId: req.user.userId,
    userRole: req.user.role,
  });
  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
    pagination: { page: currentPage, limit: Math.min(100, Math.max(1, Number(req.query.limit) || 20)), total: totalTasks, totalPages },
    // Legacy response fields retained for current clients.
    currentPage,
    totalPages,
    totalTasks,
  });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await db.taskWithRelations(req.task._id);
  res.status(200).json({ success: true, data: task });
});

const getComments = asyncHandler(async (req, res) => {
  const task = await db.taskWithRelations(req.task._id);
  res.status(200).json({ success: true, count: task.comments.length, data: task.comments });
});

const getTaskActivity = asyncHandler(async (req, res) => {
  const activities = (await db.query(`SELECT a.*, json_build_object('_id',u.id,'id',u.id,'name',u.name,'email',u.email) AS user FROM activities a JOIN users u ON u.id=a.user_id WHERE a.task_id=$1 ORDER BY a.created_at DESC LIMIT 20`, [req.task._id])).rows.map((r) => ({ ...db.toActivity(r), user:r.user }));
  res.status(200).json({ success: true, count: activities.length, data: activities });
});

const updateTask = asyncHandler(async (req, res) => {
  const updatedTask = await taskService.updateTask({
    task: req.task, payload: req.body, userId: req.user.userId, project: req.project,
    userRole: req.user.role,
  });
  emitToProject(updatedTask.project._id || updatedTask.project, "task:updated", updatedTask);
  res.status(200).json({ success: true, message: "Task updated successfully", data: updatedTask });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask({ task: req.task, user: req.user });
  emitToProject(task.project, "task:deleted", { id: task._id, project: task.project });
  res.status(200).json({ success: true, message: "Task deleted successfully" });
});

const addComment = asyncHandler(async (req, res) => {
  const task = await taskService.addComment({
    task: req.task,
    userId: req.user.userId,
    text: req.body.text,
    userRole: req.user.role,
  });
  emitToProject(task.project._id || task.project, "task:updated", task);
  res.status(201).json({ success: true, message: "Comment added", data: task });
});

module.exports = { createTask, getTasks, getTask, getComments, getTaskActivity, updateTask, deleteTask, addComment };
