const Project = require("../models/project.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const isProjectMember = asyncHandler(async (req, res, next) => {
  const projectId = req.params.projectId || req.body.projectId || req.query.projectId;

  if (!projectId) {
    throw new ApiError(400, "Project ID is required");
  }

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const isMember = project.members.some(
    (memberId) => memberId.toString() === req.user.userId,
  );

  if (!isMember) {
    throw new ApiError(403, "You are not a member of this project");
  }

  // attach project to request for reuse
  req.project = project;

  next();
});

module.exports = isProjectMember;
