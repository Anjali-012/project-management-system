const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
  addProjectMember,
} = require("../controllers/project.controller");

const { protect } = require("../middlewares/auth.middleware");

const validate = require("../middlewares/validation.middleware");

const {
  createProjectValidation,
  addMemberValidation,
} = require("../validations/project.validation");

// create project
router.post("/", protect, createProjectValidation, validate, createProject);

// get projects for logged-in user
router.get("/", protect, getProjects);

router.post(
  "/:projectId/members",
  protect,
  addMemberValidation,
  validate,
  addProjectMember,
);

module.exports = router;
