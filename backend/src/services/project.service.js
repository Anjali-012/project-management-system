const Project = require("../models/project.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const createNotification = require("../utils/createNotification");

const createProject = async ({ title, description, userId }) => {
  return Project.create({
    title,
    description,
    createdBy: userId,
    members: [userId],
  });
};

const getProjectsForUser = async (userId) => {
  return Project.find({
    members: userId,
  })
    .populate("createdBy", "name email role")
    .populate("members", "name email role")
    .sort({ updatedAt: -1 });
};

const addMember = async ({ projectId, email, actor }) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const isProjectCreator = project.createdBy.toString() === actor.userId;
  const isAdmin = actor.role === "admin";

  if (!isProjectCreator && !isAdmin) {
    throw new ApiError(403, "Not authorized to add members");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isAlreadyMember = project.members.some(
    (memberId) => memberId.toString() === user._id.toString(),
  );

  if (isAlreadyMember) {
    throw new ApiError(400, "User already a project member");
  }

  project.members.push(user._id);
  await project.save();

  await createNotification({
    user: user._id,
    message: `You were added to project ${project.title}`,
    type: "PROJECT_MEMBER_ADDED",
  });

  return project.populate("members", "name email role");
};

module.exports = {
  addMember,
  createProject,
  getProjectsForUser,
};
