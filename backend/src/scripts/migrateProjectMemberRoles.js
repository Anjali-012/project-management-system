/**
 * Safely replace the retired ProjectMember "owner" role with "manager".
 * Idempotent: rerunning after the first pass makes no changes.
 *
 * Usage: node src/scripts/migrateProjectMemberRoles.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const ProjectMember = require("../models/projectMember.model");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await ProjectMember.updateMany(
    { role: "owner" },
    { $set: { role: "manager" } },
  );
  console.log(`ProjectMember roles migrated: ${result.modifiedCount}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Project role migration failed:", err);
  process.exit(1);
});
