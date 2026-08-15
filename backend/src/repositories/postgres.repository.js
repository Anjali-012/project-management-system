const { pool } = require("../config/db");

const toUser = (row) => row && ({ _id: row.id, id: row.id, name: row.name, email: row.email, role: row.role, createdAt: row.created_at });
const toProject = (row) => row && ({ _id: row.id, id: row.id, title: row.title, description: row.description, createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at });
const toTask = (row) => row && ({
  _id: row.id, id: row.id, title: row.title, description: row.description, status: row.status, priority: row.priority,
  dueDate: row.due_date, project: row.project_id, assignedTo: row.assigned_to, createdBy: row.created_by,
  isDeleted: row.is_deleted, deletedAt: row.deleted_at, createdAt: row.created_at, updatedAt: row.updated_at,
});
const toActivity = (row) => ({ _id: row.id, id: row.id, project: row.project_id, task: row.task_id, user: row.user_id, action: row.action, metadata: row.metadata, createdAt: row.created_at });

const query = (text, values) => pool.query(text, values);
const findUserByEmail = async (email) => toUser((await query("SELECT * FROM users WHERE lower(email) = lower($1)", [email])).rows[0]);
const findUserWithPassword = async (email) => (await query("SELECT * FROM users WHERE lower(email) = lower($1)", [email])).rows[0];
const findUser = async (id) => toUser((await query("SELECT * FROM users WHERE id = $1", [id])).rows[0]);
const createUser = async ({ name, email, password, role }) => toUser((await query("INSERT INTO users (name,email,password,role) VALUES ($1,lower($2),$3,$4) RETURNING *", [name, email, password, role])).rows[0]);
const findProject = async (id) => toProject((await query("SELECT * FROM projects WHERE id = $1", [id])).rows[0]);
const getMembership = async (userId, projectId) => (await query("SELECT project_id AS project, user_id AS user, role, joined_at AS \"joinedAt\" FROM project_members WHERE user_id=$1 AND project_id=$2", [userId, projectId])).rows[0] || null;
const isMember = async (userId, projectId) => Boolean(await getMembership(userId, projectId));
const taskWithRelations = async (id) => {
  const { rows } = await query(`SELECT t.*, json_build_object('_id', p.id, 'id',p.id,'title',p.title) project_data,
    CASE WHEN au.id IS NULL THEN NULL ELSE json_build_object('_id',au.id,'id',au.id,'name',au.name,'email',au.email) END assigned_data,
    json_build_object('_id',cu.id,'id',cu.id,'name',cu.name,'email',cu.email) creator_data
    FROM tasks t JOIN projects p ON p.id=t.project_id JOIN users cu ON cu.id=t.created_by LEFT JOIN users au ON au.id=t.assigned_to WHERE t.id=$1`, [id]);
  const task = toTask(rows[0]); if (!task) return null;
  task.project = rows[0].project_data; task.assignedTo = rows[0].assigned_data; task.createdBy = rows[0].creator_data;
  const comments = await query(`SELECT c.id, c.comment AS text, c.created_at AS "createdAt", c.updated_at AS "updatedAt", json_build_object('_id',u.id,'id',u.id,'name',u.name,'email',u.email) AS user FROM comments c JOIN users u ON u.id=c.user_id WHERE c.task_id=$1 ORDER BY c.created_at ASC`, [id]);
  task.comments = comments.rows.map((c) => ({ _id: c.id, text: c.text, user: c.user, createdAt: c.createdAt, updatedAt: c.updatedAt })); return task;
};

module.exports = { query, toUser, toProject, toTask, toActivity, findUserByEmail, findUserWithPassword, findUser, createUser, findProject, getMembership, isMember, taskWithRelations };
