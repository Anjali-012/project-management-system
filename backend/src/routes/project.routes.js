const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
} = require("../controllers/project.controller");

const { protect } = require("../middlewares/auth.middleware");

const validate = require("../middlewares/validation.middleware");

const {
  createProjectValidation,
} = require("../validations/project.validation");

// create project
router.post("/", protect, createProjectValidation, validate, createProject);

// get projects for logged-in user
router.get("/", protect, getProjects);

module.exports = router;
