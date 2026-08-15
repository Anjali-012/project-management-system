const db = require("../repositories/postgres.repository");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
module.exports = asyncHandler(async (req,res,next) => { const projectId=req.params.projectId||req.body.projectId||req.query.projectId; if(!projectId) throw new ApiError(400,"Project ID is required"); const project=await db.findProject(projectId);if(!project)throw new ApiError(404,"Project not found");if(req.user.role!=="admin"&&!await db.isMember(req.user.userId,projectId))throw new ApiError(403,"You are not a member of this project");req.project=project;next(); });
