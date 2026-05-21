const Task = require("../models/task.model");
const Project = require("../models/project.model");

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo } = req.body;

    // check project exists
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // create task
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const { projectId, status } = req.query;

    // build filter object
    const filter = {};

    // filter by project
    if (projectId) {
      filter.project = projectId;
    }

    // filter by status
    if (status) {
      filter.status = status;
    }

    // fetch tasks
    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("project", "title");

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
};
