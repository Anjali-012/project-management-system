/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    name: {
      type: "varchar(100)",
      notNull: true,
    },
    email: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    password: {
      type: "varchar(255)",
      notNull: true,
    },
    role: {
      type: "varchar(30)",
      notNull: true,
      default: "member",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
  pgm.createTable("projects", {
  id: {
    type: "uuid",
    primaryKey: true,
    default: pgm.func("gen_random_uuid()"),
  },
  title: {
    type: "varchar(255)",
    notNull: true,
  },
  description: {
    type: "text",
  },
  created_by: {
    type: "uuid",
    notNull: true,
    references: "users(id)",
    onDelete: "RESTRICT",
  },
  created_at: {
    type: "timestamp",
    notNull: true,
    default: pgm.func("CURRENT_TIMESTAMP"),
  },
  updated_at: {
    type: "timestamp",
    notNull: true,
    default: pgm.func("CURRENT_TIMESTAMP"),
  },
});
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable("projects");
  pgm.dropTable("users");
};