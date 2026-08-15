const db=require("../repositories/postgres.repository");
module.exports=async({project,task=null,user,action,metadata={}})=>{try{await db.query("INSERT INTO activities (project_id,task_id,user_id,action,metadata) VALUES ($1,$2,$3,$4,$5)",[project,task,user,action,JSON.stringify(metadata)]);}catch(e){console.error("Activity log failed:",e.message);}};
