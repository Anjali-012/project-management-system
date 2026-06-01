const Task = require("../models/task.model");
const Project = require("../models/project.model");
const ApiError = require("../utils/ApiError");
const createNotification = require("../utils/createNotification");
const logActivity = require("../utils/logActivity");

const populateTask = (query) =>
  query
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
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

const createTask = async ({ payload, userId, project }) => {
  const { title, description, projectId, assignedTo, status } = payload;

  ensureAssigneeIsMember(project, assignedTo);

  const task = await Task.create({
    title,
    description,
    status,
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
    await createNotification({
      user: assignedTo,
      message: `You were assigned a new task: ${task.title}`,
      type: "TASK_ASSIGNED",
    });
  }

  return populateTask(Task.findById(task._id));
};

const getTasks = async ({
  projectId,
  status,
  search,
  page = 1,
  limit = 50,
  sortBy = "createdAt",
  order = "desc",
}) => {
  const filter = {
    isDeleted: false,
  };

  if (projectId) {
    filter.project = projectId;
  }

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.title = {
      $regex: search,
      $options: "i",
    };
  }

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

const updateTask = async ({ task, payload, userId, project }) => {
  ensureAssigneeIsMember(project, payload.assignedTo);

  const previousStatus = task.status;
  const updatedTask = await populateTask(
    Task.findByIdAndUpdate(task._id, payload, {
      new: true,
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
    await createNotification({
      user: payload.assignedTo,
      message: `You were assigned a task: ${updatedTask.title}`,
      type: "TASK_ASSIGNED",
    });
  }

  return updatedTask;
};

const deleteTask = async ({ task, user }) => {
  const isTaskCreator = task.createdBy.toString() === user.userId;
  const isAdmin = user.role === "admin";

  if (!isTaskCreator && !isAdmin) {
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

module.exports = {
  createTask,
  deleteTask,
  findProjectForTask,
  getTasks,
  updateTask,
};
