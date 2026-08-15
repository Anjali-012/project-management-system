const express = require("express");
const { getUsers, createUser } = require("../controllers/user.controller");
const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { createManagedUserValidation } = require("../validations/auth.validation");

const router = express.Router();

router.get("/", protect, getUsers);
router.post("/", protect, authorizeRoles("admin"), createManagedUserValidation, validate, createUser);

module.exports = router;
