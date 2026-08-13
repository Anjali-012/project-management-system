const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
  getProjectMembers,
  addProjectMember,
  changeMemberRole,
  removeProjectMember,
} = require("../controllers/project.controller");

const { protect } = require("../middlewares/auth.middleware");
const isProjectMember = require("../middlewares/projectMember.middleware");
const requireProjectPermission = require("../middlewares/requireProjectPermission.middleware");
const validate = require("../middlewares/validation.middleware");

const {
  createProjectValidation,
  addMemberValidation,
  changeMemberRoleValidation,
  removeMemberValidation,
} = require("../validations/project.validation");

router.post("/", protect, createProjectValidation, validate, createProject);
router.get("/", protect, getProjects);

// Member management — all require project membership + specific permission
router.get(
  "/:projectId/members",
  protect,
  isProjectMember,
  getProjectMembers,
);

router.post(
  "/:projectId/members",
  protect,
  addMemberValidation,
  validate,
  requireProjectPermission("project:manage_members"),
  addProjectMember,
);

router.patch(
  "/:projectId/members/:userId/role",
  protect,
  changeMemberRoleValidation,
  validate,
  isProjectMember,
  requireProjectPermission("project:assign_roles"),
  changeMemberRole,
);

router.delete(
  "/:projectId/members/:userId",
  protect,
  removeMemberValidation,
  validate,
  isProjectMember,
  requireProjectPermission("project:manage_members"),
  removeProjectMember,
);

module.exports = router;
