const db = require("../repositories/postgres.repository");
const ApiError = require("../utils/ApiError");
const createNotification = require("../utils/createNotification");
const { ASSIGNABLE_ROLES, canCreateProject, hasPermission, getAssignableRoles } = require("../config/permissions");

const hydrateProject = async (project) => {
  if (!project) return null;
  const { rows } = await db.query(`SELECT u.id,u.name,u.email,u.role,pm.role AS "projectRole",pm.joined_at AS "joinedAt" FROM project_members pm JOIN users u ON u.id=pm.user_id WHERE pm.project_id=$1 ORDER BY pm.joined_at`, [project._id]);
  const members = rows.map((r) => ({ _id:r.id,id:r.id,name:r.name,email:r.email,role:r.role,projectRole:r.projectRole,joinedAt:r.joinedAt }));
  const owner = await db.findUser(project.createdBy); return { ...project, createdBy: owner, members };
};
const createProject = async ({ title, description, userId, globalRole }) => {
  if (!canCreateProject(globalRole)) throw new ApiError(403, "You do not have permission to create projects");
  const client = await require("../config/db").pool.connect();
  try { await client.query("BEGIN"); const p = (await client.query("INSERT INTO projects (title,description,created_by) VALUES ($1,$2,$3) RETURNING *", [title,description || null,userId])).rows[0]; await client.query("INSERT INTO project_members (project_id,user_id,role) VALUES ($1,$2,'manager')",[p.id,userId]); await client.query("COMMIT"); return hydrateProject(db.toProject(p)); } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
};
const getProjectsForUser = async (userId, globalRole) => {
  const result = await db.query(globalRole === "admin" ? "SELECT * FROM projects ORDER BY updated_at DESC" : "SELECT p.* FROM projects p JOIN project_members pm ON pm.project_id=p.id WHERE pm.user_id=$1 ORDER BY p.updated_at DESC", globalRole === "admin" ? [] : [userId]);
  return Promise.all(result.rows.map((r) => hydrateProject(db.toProject(r))));
};
const getProjectMembers = async (projectId) => (await db.query(`SELECT u.id,u.name,u.email,u.role AS "globalRole",pm.role AS "projectRole",pm.joined_at AS "joinedAt" FROM project_members pm JOIN users u ON u.id=pm.user_id WHERE pm.project_id=$1 ORDER BY pm.joined_at`, [projectId])).rows.map((r) => ({ _id:r.id, ...r }));
const addMember = async ({ projectId, email, role = "member", actor }) => {
  if (!ASSIGNABLE_ROLES.includes(role)) throw new ApiError(400, `Role must be one of: ${ASSIGNABLE_ROLES.join(", ")}`);
  const project = await db.findProject(projectId); if (!project) throw new ApiError(404,"Project not found");
  const membership = await db.getMembership(actor.userId, projectId); if (!hasPermission(membership,"project:manage_members",actor.role)) throw new ApiError(403,"Not authorized to add members");
  if (!getAssignableRoles(membership?.role,actor.role).includes(role)) throw new ApiError(403,`Not authorized to assign role: ${role}`);
  const user = await db.findUserByEmail(email); if (!user) throw new ApiError(404,"User not found");
  if (await db.isMember(user._id,projectId)) throw new ApiError(400,"User already a project member");
  await db.query("INSERT INTO project_members (project_id,user_id,role) VALUES ($1,$2,$3)",[projectId,user._id,role]);
  await createNotification({user:user._id,message:`You were added to project ${project.title}`,type:"PROJECT_MEMBER_ADDED"}); return hydrateProject(project);
};
const changeMemberRole = async ({projectId,targetUserId,role,actor}) => {
  if (!ASSIGNABLE_ROLES.includes(role)) throw new ApiError(400,"Invalid project role"); const membership=await db.getMembership(actor.userId,projectId); if (!hasPermission(membership,"project:assign_roles",actor.role)) throw new ApiError(403,"Not authorized to change member roles"); if(targetUserId===actor.userId) throw new ApiError(403,"You cannot change your own project role"); if(!getAssignableRoles(membership?.role,actor.role).includes(role)) throw new ApiError(403,`Not authorized to assign role: ${role}`); const target=await db.getMembership(targetUserId,projectId); if(!target) throw new ApiError(404,"Membership record not found"); if(target.role==="manager") throw new ApiError(403,"Cannot change a project manager's role"); await db.query("UPDATE project_members SET role=$1 WHERE user_id=$2 AND project_id=$3",[role,targetUserId,projectId]); return {userId:targetUserId,projectRole:role};
};
const removeMember = async ({projectId,targetUserId,actor}) => { const membership=await db.getMembership(actor.userId,projectId); if(!hasPermission(membership,"project:manage_members",actor.role)) throw new ApiError(403,"Not authorized to remove members"); if(targetUserId===actor.userId) throw new ApiError(403,"You cannot remove yourself from the project"); const target=await db.getMembership(targetUserId,projectId); if(target?.role==="manager") throw new ApiError(403,"Cannot remove a project manager"); await db.query("DELETE FROM project_members WHERE user_id=$1 AND project_id=$2",[targetUserId,projectId]); return {userId:targetUserId}; };
module.exports = { addMember, changeMemberRole, createProject, getProjectMembers, getProjectsForUser, removeMember };
