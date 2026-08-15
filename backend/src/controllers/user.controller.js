const asyncHandler = require("../utils/asyncHandler");
const ProjectMember = require("../models/projectMember.model");
const User = require("../models/user.model");

// Directory is scoped to people the caller can collaborate with, never passwords.
const getUsers = asyncHandler(async (req, res) => {
  const userIds = req.user.role === "admin"
    ? await User.find({}, "_id").distinct("_id")
    : await ProjectMember.find({ user: req.user.userId }).distinct("project")
      .then((projectIds) => ProjectMember.find({ project: { $in: projectIds } }).distinct("user"));

  const users = await User.find({ _id: { $in: userIds } })
    .select("name email role createdAt")
    .sort({ name: 1 })
    .lean();

  res.status(200).json({ success: true, count: users.length, data: users });
});

module.exports = { getUsers };
