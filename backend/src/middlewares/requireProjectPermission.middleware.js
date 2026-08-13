const asyncHandler = require("../utils/asyncHandler");
const getProjectMembership = require("../utils/getProjectMembership");
const { hasPermission } = require("../config/permissions");
const ApiError = require("../utils/ApiError");

/**
 * Resolve the project ID from the request using the same sources as
 * the existing projectMember and taskMember middlewares.
 *
 * Priority:
 *   1. req.params.projectId  — project routes, activity routes
 *   2. req.body.projectId    — task create body
 *   3. req.query.projectId   — task list query
 *   4. req.project._id       — already attached by isProjectMember / isTaskMember
 *   5. req.task.project      — attached by isTaskMember
 */
const resolveProjectId = (req) =>
  req.params.projectId ||
  req.body.projectId ||
  req.query.projectId ||
  req.project?._id?.toString() ||
  req.task?.project?.toString() ||
  null;

/**
 * Middleware factory that enforces a project-level permission.
 *
 * Usage:
 *   router.patch("/:id", protect, isTaskMember, requireProjectPermission("task:edit_any"), handler);
 *
 * The middleware:
 *   - Requires req.user (set by protect middleware)
 *   - Resolves projectId from the request (see resolveProjectId above)
 *   - Looks up the caller's ProjectMember record
 *   - Delegates to hasPermission() — global admin always passes
 *   - Throws 403 if the permission is denied
 *
 * @param {string} permission - A permission string from config/permissions.js
 */
const requireProjectPermission = (permission) =>
  asyncHandler(async (req, res, next) => {
    const projectId = resolveProjectId(req);

    if (!projectId) {
      throw new ApiError(400, "Project ID could not be resolved");
    }

    const membership = await getProjectMembership(req.user.userId, projectId);

    if (!hasPermission(membership, permission, req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }

    next();
  });

module.exports = requireProjectPermission;
