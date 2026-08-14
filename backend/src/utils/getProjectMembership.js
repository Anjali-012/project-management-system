const ProjectMember = require("../models/projectMember.model");

/**
 * Resolve a user's membership record for a given project.
 *
 * Returns the ProjectMember document (with .role) or null if the user
 * is not a member. Uses the compound index { user, project } for O(1) lookup.
 *
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} projectId
 * @returns {Promise<import("../models/projectMember.model")|null>}
 */
const getProjectMembership = async (userId, projectId) => {
  return ProjectMember.findOne({ user: userId, project: projectId }).lean();
};

module.exports = getProjectMembership;
