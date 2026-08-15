const db=require("../repositories/postgres.repository");
module.exports=async({user,message,type,project=null})=>{try{await db.query("INSERT INTO notifications (user_id,project_id,message,type) VALUES ($1,$2,$3,$4)",[user,project,message,type]);}catch(e){console.error("Notification error:",e.message);}};
