/**
 * Centralized RBAC permission configuration.
 *
 * Permissions are DERIVED from project roles — never stored in MongoDB.
 * Adding a new permission: add it to the relevant role arrays below.
 * Adding a new role: add a new key with its permission array.
 */

const PROJECT_PERMISSIONS = {
  owner: [
    "project:delete",
    "project:manage_members",
    "project:assign_roles",
    "task:create",
    "task:edit_any",
    "task:delete_any",
    "task:assign",
    "activity:view",
  ],

  manager: [
    "project:manage_members",
    "project:assign_roles",
    "task:create",
    "task:edit_any",
    "task:delete_any",
    "task:assign",
    "activity:view",
  ],

  member: [
    "task:create",
    "task:edit_own",
    "task:delete_own",
    "task:assign",
    "activity:view",
  ],

  viewer: [
    "activity:view",
  ],
};

/**
 * Determine whether a user has a given permission.
 *
 * Pure function — no database access.
 *
 * @param {object|null} membership  - ProjectMember document (or null if not a member)
 * @param {string}      permission  - Permission string to check (e.g. "task:create")
 * @param {string}      globalRole  - User's global role from JWT ("admin" | "member")
 * @returns {boolean}
 */
const hasPermission = (membership, permission, globalRole) => {
  // Global admin bypasses all project-level checks
  if (globalRole === "admin") {
    return true;
  }

  // Not a project member
  if (!membership) {
    return false;
  }

  const allowed = PROJECT_PERMISSIONS[membership.role];

  // Unknown role — deny
  if (!allowed) {
    return false;
  }

  return allowed.includes(permission);
};

/**
 * Roles that can be assigned via the API — owner is never assignable.
 * Single source of truth; import this instead of redefining locally.
 */
const ASSIGNABLE_ROLES = ["manager", "member", "viewer"];

/**
 * Return the project roles the CURRENT ACTOR is allowed to assign.
 *
 * Pure function — no database access.
 *
 * @param {string} projectRole - Actor's project role ("owner"|"manager"|"member"|"viewer"|null)
 * @param {string} globalRole  - Actor's global role from JWT ("admin"|"member")
 * @returns {string[]}
 */
const getAssignableRoles = (projectRole, globalRole) => {
  if (globalRole === "admin" || projectRole === "owner") {
    return [...ASSIGNABLE_ROLES];
  }
  if (projectRole === "manager") {
    return ASSIGNABLE_ROLES.filter((role) => role !== "manager");
  }
  return [];
};

module.exports = {
  ASSIGNABLE_ROLES,
  PROJECT_PERMISSIONS,
  getAssignableRoles,
  hasPermission,
};
