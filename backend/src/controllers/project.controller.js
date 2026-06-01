const asyncHandler = require("../utils/asyncHandler");
const projectService = require("../services/project.service");

const createProject = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const project = await projectService.createProject({
    title,
    description,
    userId: req.user.userId,
  });

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: project,
  });
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjectsForUser(req.user.userId);

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects,
  });
});

const addProjectMember = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { email } = req.body;

  const project = await projectService.addMember({
    projectId,
    email,
    actor: req.user,
  });

  res.status(200).json({
    success: true,
    message: "Member added successfully",
    data: project,
  });
});

module.exports = {
  createProject,
  getProjects,
  addProjectMember,
};
