const asyncHandler = require("../utils/asyncHandler");
const projectService = require("../services/project.service");

const createProject = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const project = await projectService.createProject({
    title,
    description,
    userId: req.user.userId,
  });
  res.status(201).json({ success: true, message: "Project created successfully", data: project });
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjectsForUser(req.user.userId);
  res.status(200).json({ success: true, count: projects.length, data: projects });
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const members = await projectService.getProjectMembers(projectId);
  res.status(200).json({ success: true, count: members.length, data: members });
});

const addProjectMember = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { email, role } = req.body;
  const project = await projectService.addMember({
    projectId,
    email,
    role,
    actor: req.user,
  });
  res.status(200).json({ success: true, message: "Member added successfully", data: project });
});

const changeMemberRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;
  const result = await projectService.changeMemberRole({
    projectId,
    targetUserId: userId,
    role,
    actor: req.user,
  });
  res.status(200).json({ success: true, message: "Role updated successfully", data: result });
});

const removeProjectMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  await projectService.removeMember({
    projectId,
    targetUserId: userId,
    actor: req.user,
  });
  res.status(200).json({ success: true, message: "Member removed successfully" });
});

module.exports = {
  createProject,
  getProjects,
  getProjectMembers,
  addProjectMember,
  changeMemberRole,
  removeProjectMember,
};
