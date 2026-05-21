const Project = require("../models/project.model");

const asyncHandler = require("../utils/asyncHandler");

const createProject = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const project = await Project.create({
    title,
    description,
    createdBy: req.user.userId,
    members: [req.user.userId],
  });

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: project,
  });
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    members: req.user.userId,
  })
    .populate("createdBy", "name email role")
    .populate("members", "name email");

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects,
  });
});

module.exports = {
  createProject,
  getProjects,
};
