module.exports = (userId, projectId) => require("../repositories/postgres.repository").getMembership(userId, projectId);
