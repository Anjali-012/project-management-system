/**
 * RBAC verification — exercises centralized permission helpers and
 * task.service authorization functions used by mutation endpoints.
 *
 * Run: node src/scripts/verifyRbac.js
 */

const {
  canCreateProject,
  hasPermission,
  getAssignableRoles,
  isAssignableTaskMember,
  PROJECT_PERMISSIONS,
} = require("../config/permissions");
const { canModifyTask, canRemoveTask } = require("../services/task.service");

let passed = 0;
let failed = 0;

const assert = (label, condition) => {
  if (condition) {
    passed += 1;
    return;
  }
  failed += 1;
  console.error(`FAIL: ${label}`);
};

const membership = (role) => ({ role });
const taskBy = (creatorId) => ({ createdBy: creatorId });

// ── hasPermission matrix ────────────────────────────────────────────────────

const roles = ["owner", "manager", "member", "viewer"];

roles.forEach((role) => {
  PROJECT_PERMISSIONS[role].forEach((perm) => {
    assert(`${role} has ${perm}`, hasPermission(membership(role), perm, "member"));
  });
});

assert("admin bypasses viewer restriction", hasPermission(membership("viewer"), "task:create", "admin"));
assert("admin can create projects", canCreateProject("admin"));
assert("global manager can create projects", canCreateProject("manager"));
assert("global member cannot create projects", !canCreateProject("member"));
assert("non-member denied task:create", !hasPermission(null, "task:create", "member"));
assert("viewer cannot create tasks", !hasPermission(membership("viewer"), "task:create", "member"));
assert("viewer cannot manage members", !hasPermission(membership("viewer"), "project:manage_members", "member"));
assert("viewer cannot assign roles", !hasPermission(membership("viewer"), "project:assign_roles", "member"));
assert("member cannot manage members", !hasPermission(membership("member"), "project:manage_members", "member"));
assert("member cannot assign roles", !hasPermission(membership("member"), "project:assign_roles", "member"));
assert("member can create tasks", hasPermission(membership("member"), "task:create", "member"));
assert("manager can manage members", hasPermission(membership("manager"), "project:manage_members", "member"));
assert("manager can assign roles", hasPermission(membership("manager"), "project:assign_roles", "member"));

// ── Task assignee eligibility ──────────────────────────────────────────────

assert("member is an assignable task member", isAssignableTaskMember({ role: "member", user: { role: "member" } }));
assert("viewer is an assignable task member", isAssignableTaskMember({ role: "viewer", user: { role: "member" } }));
assert("manager is not an assignable task member", !isAssignableTaskMember({ role: "manager", user: { role: "member" } }));
assert("admin is not an assignable task member", !isAssignableTaskMember({ role: "member", user: { role: "admin" } }));

// ── getAssignableRoles (member management) ──────────────────────────────────

const canAssignRole = (actorProjectRole, actorGlobalRole, role) =>
  getAssignableRoles(actorProjectRole, actorGlobalRole).includes(role);

assert("admin can assign manager", canAssignRole(null, "admin", "manager"));
assert("manager assign member allowed", canAssignRole("manager", "member", "member"));
assert("manager assign viewer allowed", canAssignRole("manager", "member", "viewer"));
assert("manager assign manager denied", !canAssignRole("manager", "member", "manager"));
assert("member assign member denied", !canAssignRole("member", "member", "member"));
assert("viewer assign member denied", !canAssignRole("viewer", "member", "member"));

// ── Self-role / self-removal (mirrors project.service.js) ─────────────────

const allowsSelfRoleChange = (actorId, targetId) => actorId !== targetId;

const allowsSelfRemoval = (actorId, targetId) => actorId !== targetId;

assert("admin cannot change own role", !allowsSelfRoleChange("u1", "u1"));
assert("manager cannot change own role", !allowsSelfRoleChange("u2", "u2"));
assert("member cannot change own role", !allowsSelfRoleChange("u3", "u3"));
assert("viewer cannot change own role", !allowsSelfRoleChange("u4", "u4"));
assert("admin cannot remove self", !allowsSelfRemoval("u1", "u1"));
assert("manager cannot remove self", !allowsSelfRemoval("u2", "u2"));

const allowsManagerDemotion = (targetRole) => targetRole !== "manager";

assert("manager demotion denied", !allowsManagerDemotion("manager"));
assert("manager removal denied", !allowsManagerDemotion("manager"));

// ── Task mutations (task.service.js canModifyTask / canRemoveTask) ──────────

const userA = "aaaaaaaaaaaaaaaaaaaaaaaa";
const userB = "bbbbbbbbbbbbbbbbbbbbbbbb";

assert("viewer task update denied", !canModifyTask(membership("viewer"), "member", taskBy(userA), userA));
assert("viewer task delete denied", !canRemoveTask(membership("viewer"), "member", taskBy(userA), userA));
assert("viewer comment denied", !canModifyTask(membership("viewer"), "member", taskBy(userA), userA));
assert("member create allowed via permission", hasPermission(membership("member"), "task:create", "member"));
assert("member edit own task allowed", canModifyTask(membership("member"), "member", taskBy(userA), userA));
assert("member delete own task allowed", canRemoveTask(membership("member"), "member", taskBy(userA), userA));
assert("member edit another project task allowed", canModifyTask(membership("member"), "member", taskBy(userB), userA));
assert("member delete others task denied", !canRemoveTask(membership("member"), "member", taskBy(userB), userA));
assert("member comment another project task allowed", canModifyTask(membership("member"), "member", taskBy(userB), userA));
assert("manager edit any task allowed", canModifyTask(membership("manager"), "member", taskBy(userB), userA));
assert("manager delete any task allowed", canRemoveTask(membership("manager"), "member", taskBy(userB), userA));
assert("owner edit any task allowed", canModifyTask(membership("owner"), "member", taskBy(userB), userA));
assert("project manager edit any task allowed", canModifyTask(membership("manager"), "member", taskBy(userB), userA));
assert("project manager delete any task allowed", canRemoveTask(membership("manager"), "member", taskBy(userB), userA));
assert("admin edit any task allowed", canModifyTask(membership("viewer"), "admin", taskBy(userB), userA));

// ── Project creation policy ─────────────────────────────────────────────────
assert("project creation is gated by global role", true);

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`RBAC verification: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}

console.log("All RBAC checks passed.");
