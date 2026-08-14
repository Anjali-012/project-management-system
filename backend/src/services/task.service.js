const Task = require("../models/task.model");
const Project = require("../models/project.model");
const ProjectMember = require("../models/projectMember.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const logActivity = require("../utils/logActivity");
const notifyUser = require("../utils/notifyUser");
const { hasPermission } = require("../config/permissions");

const populateTask = (query) =>
  query
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("comments.user", "name email")
    .populate("project", "title");

const ensureAssigneeIsMember = (project, assignedTo) => {
  if (!assignedTo) {
    return;
  }

  const isMember = project.members.some(
    (memberId) => memberId.toString() === assignedTo.toString(),
  );

  if (!isMember) {
    throw new ApiError(400, "Assigned user must be a project member");
  }
};

const getMembership = (userId, projectId) =>
  ProjectMember.findOne({ user: userId, project: projectId }).lean();

const canModifyTask = (membership, globalRole, task, userId) => {
  if (hasPermission(membership, "task:edit_any", globalRole)) {
    return true;
  }

  if (
    hasPermission(membership, "task:edit_own", globalRole) &&
    task.createdBy.toString() === userId.toString()
  ) {
    return true;
  }

  return false;
};

const canRemoveTask = (membership, globalRole, task, userId) => {
  if (hasPermission(membership, "task:delete_any", globalRole)) {
    return true;
  }

  if (
    hasPermission(membership, "task:delete_own", globalRole) &&
    task.createdBy.toString() === userId.toString()
  ) {
    return true;
  }

  return false;
};

const createTask = async ({ payload, userId, project, userRole }) => {
  const { title, description, projectId, assignedTo, status, priority, dueDate } = payload;

  const membership = await getMembership(userId, projectId);
  if (!hasPermission(membership, "task:create", userRole)) {
    throw new ApiError(403, "You do not have permission to create tasks");
  }

  ensureAssigneeIsMember(project, assignedTo);

  const task = await Task.create({
    title, description, status, priority,
    dueDate: dueDate || null,
    project: projectId,
    assignedTo,
    createdBy: userId,
  });

  await logActivity({
    project: projectId,
    user: userId,
    action: "TASK_CREATED",
    metadata: {
      taskId: task._id,
      title: task.title,
    },
  });

  if (assignedTo) {
    const assignee = await User.findById(assignedTo).select("name email");
    if (assignee) {
      notifyUser({ type: "TASK_ASSIGNED", user: assignee, task });
    }
  }

  return populateTask(Task.findById(task._id));
};

const getTasks = async ({
  projectId, status, search, priority, assignedTo,
  page = 1, limit = 50, sortBy = "createdAt", order = "desc",
}) => {
  const filter = { isDeleted: false };
  if (projectId) filter.project = projectId;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) filter.title = { $regex: search, $options: "i" };

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  const sortOptions = {
    [sortBy]: order === "asc" ? 1 : -1,
  };

  const [tasks, totalTasks] = await Promise.all([
    populateTask(Task.find(filter))
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber),
    Task.countDocuments(filter),
  ]);

  return {
    tasks,
    totalTasks,
    currentPage: pageNumber,
    totalPages: Math.ceil(totalTasks / limitNumber) || 1,
  };
};

const updateTask = async ({ task, payload, userId, project, userRole }) => {
  const membership = await getMembership(userId, task.project);
  if (!canModifyTask(membership, userRole, task, userId)) {
    throw new ApiError(403, "You do not have permission to update this task");
  }

  ensureAssigneeIsMember(project, payload.assignedTo);

  const previousStatus = task.status;
  const updatedTask = await populateTask(
    Task.findByIdAndUpdate(task._id, payload, {
      returnDocument: "after",
      runValidators: true,
    }),
  );

  await logActivity({
    project: task.project,
    user: userId,
    action: previousStatus !== updatedTask.status ? "TASK_STATUS_UPDATED" : "TASK_UPDATED",
    metadata: {
      taskId: task._id,
      from: previousStatus,
      to: updatedTask.status,
    },
  });

  if (
    payload.assignedTo &&
    (!task.assignedTo || task.assignedTo.toString() !== payload.assignedTo)
  ) {
    // updatedTask.assignedTo is already populated — no extra DB call needed
    notifyUser({ type: "TASK_ASSIGNED", user: updatedTask.assignedTo, task: updatedTask });
  }

  return updatedTask;
};

const deleteTask = async ({ task, user }) => {
  const membership = await getMembership(user.userId, task.project);
  if (!canRemoveTask(membership, user.role, task, user.userId)) {
    throw new ApiError(403, "You are not allowed to delete this task");
  }

  task.isDeleted = true;
  task.deletedAt = new Date();
  await task.save();

  await logActivity({
    project: task.project,
    user: user.userId,
    action: "TASK_DELETED",
    metadata: { taskId: task._id },
  });

  return task;
};

const findProjectForTask = async (task) => {
  const project = await Project.findById(task.project);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

const addComment = async ({ task, userId, text, userRole }) => {
  const membership = await getMembership(userId, task.project);
  if (!canModifyTask(membership, userRole, task, userId)) {
    throw new ApiError(403, "You do not have permission to comment on this task");
  }

  task.comments.push({ user: userId, text });
  await task.save();

  await logActivity({
    project: task.project,
    user: userId,
    action: "COMMENT_ADDED",
    metadata: { taskId: task._id, taskTitle: task.title },
  });

  return populateTask(Task.findById(task._id));
};

module.exports = {
  addComment,
  canModifyTask,
  canRemoveTask,
  createTask,
  deleteTask,
  findProjectForTask,
  getTasks,
  updateTask,
};
