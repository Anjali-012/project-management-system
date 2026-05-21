const Project = require("../models/project.model");

const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");

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

const addProjectMember = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const { email } = req.body;

  // find project
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // only creator/admin can add members
  const isProjectCreator = project.createdBy.toString() === req.user.userId;

  const isAdmin = req.user.role === "admin";

  if (!isProjectCreator && !isAdmin) {
    throw new ApiError(403, "Not authorized to add members");
  }

  // find user
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check already member
  const isAlreadyMember = project.members.includes(user._id);

  if (isAlreadyMember) {
    throw new ApiError(400, "User already a project member");
  }

  // add member
  project.members.push(user._id);

  await project.save();

  await project.populate("members", "name email role");

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
