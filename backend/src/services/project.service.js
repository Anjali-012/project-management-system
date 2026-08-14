const Project = require("../models/project.model");
const ProjectMember = require("../models/projectMember.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const createNotification = require("../utils/createNotification");
const { ASSIGNABLE_ROLES, hasPermission, getAssignableRoles } = require("../config/permissions");

const createProject = async ({ title, description, userId }) => {
  // Global authorization: any authenticated user may create a project.
  // Project-level roles do not gate creation; the creator becomes owner.
  const project = await Project.create({
    title,
    description,
    createdBy: userId,
    members: [userId],
  });

  try {
    await ProjectMember.create({ user: userId, project: project._id, role: "owner" });
  } catch (err) {
    if (err.code !== 11000) {
      console.error("[RBAC] ProjectMember owner sync failed", err.message);
    }
  }

  return project;
};

const getProjectsForUser = async (userId) => {
  return Project.find({ members: userId })
    .populate("createdBy", "name email role")
    .populate("members", "name email role")
    .sort({ updatedAt: -1 });
};

/**
 * Return members of a project with their project roles.
 * Requires the caller to already be verified as a project member.
 */
const getProjectMembers = async (projectId) => {
  const pmRecords = await ProjectMember.find({ project: projectId })
    .populate("user", "name email role")
    .lean();

  return pmRecords.map((pm) => ({
    _id: pm.user._id,
    name: pm.user.name,
    email: pm.user.email,
    globalRole: pm.user.role,
    projectRole: pm.role,
    joinedAt: pm.joinedAt,
  }));
};

const addMember = async ({ projectId, email, role = "member", actor }) => {
  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new ApiError(400, `Role must be one of: ${ASSIGNABLE_ROLES.join(", ")}`);
  }

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const actorMembership = await ProjectMember.findOne({
    user: actor.userId,
    project: projectId,
  }).lean();

  if (!hasPermission(actorMembership, "project:manage_members", actor.role)) {
    throw new ApiError(403, "Not authorized to add members");
  }

  const allowed = getAssignableRoles(actorMembership?.role ?? null, actor.role);
  if (!allowed.includes(role)) {
    throw new ApiError(403, `Not authorized to assign role: ${role}`);
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const isAlreadyMember = project.members.some(
    (id) => id.toString() === user._id.toString(),
  );
  if (isAlreadyMember) throw new ApiError(400, "User already a project member");

  // Write Project.members first (existing auth gate)
  project.members.push(user._id);
  await project.save();

  // Sync ProjectMember
  try {
    await ProjectMember.create({ user: user._id, project: project._id, role });
  } catch (err) {
    if (err.code !== 11000) {
      console.error("[RBAC] ProjectMember sync failed for user", user._id, err.message);
    }
  }

  await createNotification({
    user: user._id,
    message: `You were added to project ${project.title}`,
    type: "PROJECT_MEMBER_ADDED",
  });

  return project.populate("members", "name email role");
};

/**
 * Change an existing member's project role.
 * Owner role is protected — cannot be assigned or removed via this endpoint.
 */
const changeMemberRole = async ({ projectId, targetUserId, role, actor }) => {
  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new ApiError(400, `Role must be one of: ${ASSIGNABLE_ROLES.join(", ")}`);
  }

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const isMember = project.members.some(
    (id) => id.toString() === targetUserId,
  );
  if (!isMember) throw new ApiError(404, "User is not a member of this project");

  const actorMembership = await ProjectMember.findOne({
    user: actor.userId,
    project: projectId,
  }).lean();

  if (!hasPermission(actorMembership, "project:assign_roles", actor.role)) {
    throw new ApiError(403, "Not authorized to change member roles");
  }

  if (actor.role !== "admin" && targetUserId === actor.userId) {
    throw new ApiError(403, "You cannot change your own project role");
  }

  const allowed = getAssignableRoles(actorMembership?.role ?? null, actor.role);
  if (!allowed.includes(role)) {
    throw new ApiError(403, `Not authorized to assign role: ${role}`);
  }

  const targetPM = await ProjectMember.findOne({
    user: targetUserId,
    project: projectId,
  });
  if (!targetPM) throw new ApiError(404, "Membership record not found");

  // Owner is immutable through this endpoint
  if (targetPM.role === "owner") {
    throw new ApiError(403, "Cannot change the project owner's role");
  }

  targetPM.role = role;
  await targetPM.save();

  return { userId: targetUserId, projectRole: role };
};

/**
 * Remove a member from a project.
 * Owner cannot be removed.
 */
const removeMember = async ({ projectId, targetUserId, actor }) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const actorMembership = await ProjectMember.findOne({
    user: actor.userId,
    project: projectId,
  }).lean();

  if (!hasPermission(actorMembership, "project:manage_members", actor.role)) {
    throw new ApiError(403, "Not authorized to remove members");
  }

  if (actor.role !== "admin" && targetUserId === actor.userId) {
    throw new ApiError(403, "You cannot remove yourself from the project");
  }

  const isMember = project.members.some(
    (id) => id.toString() === targetUserId,
  );
  if (!isMember) throw new ApiError(404, "User is not a member of this project");

  const targetPM = await ProjectMember.findOne({
    user: targetUserId,
    project: projectId,
  });

  if (targetPM?.role === "owner") {
    throw new ApiError(403, "Cannot remove the project owner");
  }

  // Remove from flat array
  project.members = project.members.filter(
    (id) => id.toString() !== targetUserId,
  );
  await project.save();

  // Remove ProjectMember record
  await ProjectMember.deleteOne({ user: targetUserId, project: projectId });

  return { userId: targetUserId };
};

module.exports = {
  addMember,
  changeMemberRole,
  createProject,
  getProjectMembers,
  getProjectsForUser,
  removeMember,
};
