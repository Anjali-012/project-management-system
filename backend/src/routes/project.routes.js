const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
} = require("../controllers/project.controller");

const { protect } = require("../middlewares/auth.middleware");

// create project
router.post("/", protect, createProject);

// get projects for logged-in user
router.get("/", protect, getProjects);

module.exports = router;
