/**
 * Audit: Compare Project.members (legacy) against ProjectMember (RBAC).
 *
 * READ-ONLY — makes zero writes to the database.
 * Safe to run repeatedly at any time.
 *
 * Checks per project:
 *   A. Members in Project.members missing from ProjectMember
 *   B. ProjectMember records not present in Project.members (orphans)
 *   C. Duplicate ProjectMember records for the same user
 *   D. No ProjectMember with role "owner"
 *   E. ProjectMember records referencing a non-existent user
 *   F. ProjectMember records referencing a non-existent project
 *   G. Project.members entries referencing a non-existent user
 *   H. createdBy does not have a ProjectMember with role "owner"
 *   I. Multiple ProjectMember records with role "owner"
 *
 * Usage:
 *   node src/scripts/auditProjectMembers.js
 *
 * Requires MONGO_URI in environment (loads .env automatically).
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Project = require("../models/project.model");
const ProjectMember = require("../models/projectMember.model");
const User = require("../models/user.model");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.\n");

  // ── Load all data up front to avoid N+1 queries ──────────────────────────

  const [projects, allMembers, allUsers] = await Promise.all([
    Project.find({}).lean(),
    ProjectMember.find({}).lean(),
    User.find({}, "_id").lean(),
  ]);

  const userIdSet = new Set(allUsers.map((u) => u._id.toString()));
  const projectIdSet = new Set(projects.map((p) => p._id.toString()));

  // Index ProjectMember records by project for fast lookup
  const membersByProject = new Map(); // projectId → ProjectMember[]
  for (const pm of allMembers) {
    const key = pm.project.toString();
    if (!membersByProject.has(key)) membersByProject.set(key, []);
    membersByProject.get(key).push(pm);
  }

  // ── Counters ──────────────────────────────────────────────────────────────

  let totalLegacyMemberships = 0;
  let totalPMMemberships = allMembers.length;

  const issues = {
    missingPM: [],          // A
    orphanPM: [],           // B
    duplicatePM: [],        // C
    noOwner: [],            // D
    invalidUserInPM: [],    // E
    invalidProjectInPM: [], // F
    invalidUserInLegacy: [], // G
    createdByNotOwner: [],  // H
    multipleOwners: [],     // I
  };

  // ── F: ProjectMember records pointing to a non-existent project ───────────
  for (const pm of allMembers) {
    if (!projectIdSet.has(pm.project.toString())) {
      issues.invalidProjectInPM.push({
        pmId: pm._id.toString(),
        projectId: pm.project.toString(),
        userId: pm.user.toString(),
      });
    }
  }

  // ── Per-project checks ────────────────────────────────────────────────────
  const projectsRequiringAction = new Set();

  for (const project of projects) {
    const pid = project._id.toString();
    const pmRecords = membersByProject.get(pid) || [];

    // Build lookup maps for this project
    const pmByUser = new Map(); // userId → ProjectMember[]
    for (const pm of pmRecords) {
      const uid = pm.user.toString();
      if (!pmByUser.has(uid)) pmByUser.set(uid, []);
      pmByUser.get(uid).push(pm);
    }

    const legacyUserIds = new Set(
      (project.members || []).map((id) => id.toString()),
    );
    totalLegacyMemberships += legacyUserIds.size;

    // G: Project.members entries referencing a non-existent user
    for (const uid of legacyUserIds) {
      if (!userIdSet.has(uid)) {
        issues.invalidUserInLegacy.push({ projectId: pid, userId: uid });
        projectsRequiringAction.add(pid);
      }
    }

    // A: In legacy but missing from ProjectMember
    for (const uid of legacyUserIds) {
      if (!pmByUser.has(uid)) {
        issues.missingPM.push({ projectId: pid, userId: uid, projectTitle: project.title });
        projectsRequiringAction.add(pid);
      }
    }

    // B: In ProjectMember but not in legacy (orphan)
    for (const [uid] of pmByUser) {
      if (!legacyUserIds.has(uid)) {
        issues.orphanPM.push({ projectId: pid, userId: uid, projectTitle: project.title });
        projectsRequiringAction.add(pid);
      }
    }

    // C: Duplicate ProjectMember records (same user, same project)
    for (const [uid, records] of pmByUser) {
      if (records.length > 1) {
        issues.duplicatePM.push({
          projectId: pid,
          userId: uid,
          count: records.length,
          pmIds: records.map((r) => r._id.toString()),
        });
        projectsRequiringAction.add(pid);
      }
    }

    // E: ProjectMember records referencing a non-existent user
    for (const pm of pmRecords) {
      if (!userIdSet.has(pm.user.toString())) {
        issues.invalidUserInPM.push({
          pmId: pm._id.toString(),
          projectId: pid,
          userId: pm.user.toString(),
        });
        projectsRequiringAction.add(pid);
      }
    }

    // D: No owner in ProjectMember
    const owners = pmRecords.filter((pm) => pm.role === "owner");
    if (owners.length === 0) {
      issues.noOwner.push({ projectId: pid, projectTitle: project.title });
      projectsRequiringAction.add(pid);
    }

    // I: Multiple owners
    if (owners.length > 1) {
      issues.multipleOwners.push({
        projectId: pid,
        projectTitle: project.title,
        ownerUserIds: owners.map((o) => o.user.toString()),
      });
      projectsRequiringAction.add(pid);
    }

    // H: createdBy does not have role "owner" in ProjectMember
    if (project.createdBy) {
      const creatorId = project.createdBy.toString();
      const creatorRecords = pmByUser.get(creatorId) || [];
      const creatorIsOwner = creatorRecords.some((pm) => pm.role === "owner");
      if (!creatorIsOwner) {
        issues.createdByNotOwner.push({
          projectId: pid,
          projectTitle: project.title,
          createdBy: creatorId,
          creatorPMRoles: creatorRecords.map((r) => r.role),
        });
        projectsRequiringAction.add(pid);
      }
    }
  }

  // ── Report ────────────────────────────────────────────────────────────────

  console.log("══════════════════════════════════════════════════");
  console.log("  RBAC Consistency Audit — Project Members");
  console.log("══════════════════════════════════════════════════\n");

  console.log(`Projects inspected:                  ${projects.length}`);
  console.log(`Legacy memberships (Project.members): ${totalLegacyMemberships}`);
  console.log(`ProjectMember records:               ${totalPMMemberships}`);
  console.log(`Projects requiring migration/repair: ${projectsRequiringAction.size}`);

  console.log("\n── A. Missing ProjectMember records ──────────────");
  console.log(`  Count: ${issues.missingPM.length}`);
  if (issues.missingPM.length) {
    for (const i of issues.missingPM)
      console.log(`  Project "${i.projectTitle}" (${i.projectId}) → user ${i.userId}`);
  }

  console.log("\n── B. Orphan ProjectMember records ───────────────");
  console.log(`  Count: ${issues.orphanPM.length}`);
  if (issues.orphanPM.length) {
    for (const i of issues.orphanPM)
      console.log(`  Project "${i.projectTitle}" (${i.projectId}) → user ${i.userId}`);
  }

  console.log("\n── C. Duplicate ProjectMember records ────────────");
  console.log(`  Count: ${issues.duplicatePM.length}`);
  if (issues.duplicatePM.length) {
    for (const i of issues.duplicatePM)
      console.log(`  Project ${i.projectId} → user ${i.userId} (${i.count} records: ${i.pmIds.join(", ")})`);
  }

  console.log("\n── D. Projects with no ProjectMember owner ───────");
  console.log(`  Count: ${issues.noOwner.length}`);
  if (issues.noOwner.length) {
    for (const i of issues.noOwner)
      console.log(`  Project "${i.projectTitle}" (${i.projectId})`);
  }

  console.log("\n── E. ProjectMember → non-existent user ──────────");
  console.log(`  Count: ${issues.invalidUserInPM.length}`);
  if (issues.invalidUserInPM.length) {
    for (const i of issues.invalidUserInPM)
      console.log(`  PM ${i.pmId} in project ${i.projectId} → missing user ${i.userId}`);
  }

  console.log("\n── F. ProjectMember → non-existent project ───────");
  console.log(`  Count: ${issues.invalidProjectInPM.length}`);
  if (issues.invalidProjectInPM.length) {
    for (const i of issues.invalidProjectInPM)
      console.log(`  PM ${i.pmId} → missing project ${i.projectId} (user ${i.userId})`);
  }

  console.log("\n── G. Project.members → non-existent user ────────");
  console.log(`  Count: ${issues.invalidUserInLegacy.length}`);
  if (issues.invalidUserInLegacy.length) {
    for (const i of issues.invalidUserInLegacy)
      console.log(`  Project ${i.projectId} → missing user ${i.userId}`);
  }

  console.log("\n── H. createdBy not owner in ProjectMember ───────");
  console.log(`  Count: ${issues.createdByNotOwner.length}`);
  if (issues.createdByNotOwner.length) {
    for (const i of issues.createdByNotOwner)
      console.log(
        `  Project "${i.projectTitle}" (${i.projectId}) → createdBy ${i.createdBy}` +
        (i.creatorPMRoles.length
          ? ` has role(s): [${i.creatorPMRoles.join(", ")}]`
          : " has no ProjectMember record"),
      );
  }

  console.log("\n── I. Projects with multiple owners ──────────────");
  console.log(`  Count: ${issues.multipleOwners.length}`);
  if (issues.multipleOwners.length) {
    for (const i of issues.multipleOwners)
      console.log(`  Project "${i.projectTitle}" (${i.projectId}) → owners: ${i.ownerUserIds.join(", ")}`);
  }

  console.log("\n══════════════════════════════════════════════════");
  const clean = projectsRequiringAction.size === 0;
  console.log(clean
    ? "  ✓ No inconsistencies found. Systems are in sync."
    : `  ✗ ${projectsRequiringAction.size} project(s) require migration or repair.`);
  console.log("══════════════════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("Disconnected. Audit complete.");

  process.exit(clean ? 0 : 1);
};

run().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
