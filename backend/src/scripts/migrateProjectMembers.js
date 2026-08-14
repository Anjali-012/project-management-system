/**
 * Migration: Seed ProjectMember records from existing Project.members arrays.
 *
 * Safe to run multiple times — idempotent via the unique compound index.
 * Does NOT modify any existing Project, User, or Task documents.
 *
 * Usage:
 *   node src/scripts/migrateProjectMembers.js
 *
 * Requires MONGO_URI in environment (loads .env automatically).
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Project = require("../models/project.model");
const ProjectMember = require("../models/projectMember.model");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const projects = await Project.find({}).lean();

  let processed = 0;
  let created = 0;
  let alreadyExisting = 0;
  let skipped = 0;
  let needsReview = 0;

  for (const project of projects) {
    processed++;

    if (!project.members || project.members.length === 0) {
      console.log(`  [SKIP] Project "${project.title}" (${project._id}) has no members.`);
      skipped++;
      continue;
    }

    if (!project.createdBy) {
      console.warn(
        `  [REVIEW] Project "${project.title}" (${project._id}) has no createdBy — cannot assign manager. Manual review required.`,
      );
      needsReview++;
    }

    // Deduplicate member IDs within this project's array
    const seen = new Set();
    const uniqueMembers = [];
    for (const memberId of project.members) {
      const key = memberId.toString();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMembers.push(memberId);
      }
    }

    for (const memberId of uniqueMembers) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        console.warn(
          `  [SKIP] Invalid ObjectId "${memberId}" in project "${project.title}" (${project._id}).`,
        );
        skipped++;
        continue;
      }

      const isCreator =
        project.createdBy &&
        memberId.toString() === project.createdBy.toString();

      const role = isCreator ? "manager" : "member";

      try {
        await ProjectMember.create({
          user: memberId,
          project: project._id,
          role,
          joinedAt: project.createdAt || new Date(),
        });
        created++;
      } catch (err) {
        // Duplicate key error (code 11000) — record already exists, safe to skip
        if (err.code === 11000) {
          alreadyExisting++;
        } else {
          console.error(
            `  [ERROR] Failed to create membership for user ${memberId} in project ${project._id}:`,
            err.message,
          );
          skipped++;
        }
      }
    }
  }

  console.log("\n── Migration Summary ──────────────────────────");
  console.log(`  Projects processed:               ${processed}`);
  console.log(`  Memberships created:              ${created}`);
  console.log(`  Memberships already existing:     ${alreadyExisting}`);
  console.log(`  Invalid records skipped:          ${skipped}`);
  console.log(`  Projects requiring manual review: ${needsReview}`);
  console.log("───────────────────────────────────────────────\n");

  await mongoose.disconnect();
  console.log("Disconnected. Migration complete.");
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
