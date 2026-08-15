export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("project_members", {
    project_id: { type: "uuid", notNull: true, references: "projects(id)", onDelete: "CASCADE" },
    user_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "CASCADE" },
    role: { type: "varchar(20)", notNull: true, default: "member", check: "role IN ('manager', 'member', 'viewer')" },
    joined_at: { type: "timestamptz", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
  }, { constraints: { primaryKey: ["project_id", "user_id"] } });

  pgm.createTable("tasks", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    title: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    status: { type: "varchar(20)", notNull: true, default: "todo", check: "status IN ('todo', 'in-progress', 'blocked', 'done')" },
    priority: { type: "varchar(20)", notNull: true, default: "medium", check: "priority IN ('low', 'medium', 'high', 'urgent')" },
    due_date: { type: "timestamptz" },
    project_id: { type: "uuid", notNull: true, references: "projects(id)", onDelete: "CASCADE" },
    assigned_to: { type: "uuid", references: "users(id)", onDelete: "SET NULL" },
    created_by: { type: "uuid", notNull: true, references: "users(id)", onDelete: "RESTRICT" },
    is_deleted: { type: "boolean", notNull: true, default: false },
    deleted_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
  });

  pgm.createTable("comments", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    task_id: { type: "uuid", notNull: true, references: "tasks(id)", onDelete: "CASCADE" },
    user_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "RESTRICT" },
    comment: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
  });

  pgm.createTable("activities", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    project_id: { type: "uuid", notNull: true, references: "projects(id)", onDelete: "CASCADE" },
    task_id: { type: "uuid", references: "tasks(id)", onDelete: "SET NULL" },
    user_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "RESTRICT" },
    action: { type: "varchar(50)", notNull: true },
    metadata: { type: "jsonb", notNull: true, default: "{}" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
  });

  pgm.createTable("notifications", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", notNull: true, references: "users(id)", onDelete: "CASCADE" },
    project_id: { type: "uuid", references: "projects(id)", onDelete: "CASCADE" },
    message: { type: "text", notNull: true },
    type: { type: "varchar(50)" },
    is_read: { type: "boolean", notNull: true, default: false },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("CURRENT_TIMESTAMP") },
  });

  pgm.createIndex("project_members", "user_id");
  pgm.createIndex("tasks", ["project_id", "is_deleted", "created_at"]);
  pgm.createIndex("tasks", ["status", "is_deleted"]);
  pgm.createIndex("tasks", ["priority", "is_deleted"]);
  pgm.createIndex("tasks", ["assigned_to", "is_deleted"]);
  pgm.createIndex("tasks", ["due_date", "is_deleted"]);
  pgm.createIndex("tasks", ["updated_at", "is_deleted"]);
  pgm.createIndex("comments", ["task_id", "created_at"]);
  pgm.createIndex("activities", ["project_id", "created_at"]);
  pgm.createIndex("activities", ["task_id", "created_at"]);
  pgm.createIndex("notifications", ["user_id", "is_read", "created_at"]);
};

export const down = (pgm) => {
  pgm.dropTable("notifications"); pgm.dropTable("activities"); pgm.dropTable("comments");
  pgm.dropTable("tasks"); pgm.dropTable("project_members");
};
