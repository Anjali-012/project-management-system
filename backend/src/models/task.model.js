const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Task title is required"], trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ["todo", "in-progress", "done", "blocked"], default: "todo" },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    dueDate: { type: Date, default: null },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    comments: [commentSchema],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Supports the assignment-facing task list without loading all tasks in memory.
taskSchema.index({ project: 1, isDeleted: 1, status: 1, priority: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1, isDeleted: 1, createdAt: -1 });
taskSchema.index({ isDeleted: 1, dueDate: 1 });

module.exports = mongoose.model("Task", taskSchema);
