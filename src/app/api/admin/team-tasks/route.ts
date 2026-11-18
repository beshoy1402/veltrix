import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
const URL=process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
async function isAdmin(request:NextRequest){
 const auth=request.headers.get("authorization")||"";
 if(!URL||!PUBLIC_KEY||!SECRET||!auth.startsWith("Bearer "))return false;
 const r=await fetch(URL+"/auth/v1/user",{headers:{apikey:PUBLIC_KEY,Authorization:auth},cache:"no-store"});
 if(!r.ok)return false;const user=await r.json();return user?.app_metadata?.role==="admin";
}
const headers=(extra:Record<string,string>={})=>({apikey:SECRET||"",Authorization:"Bearer "+(SECRET||""),...extra});
export async function GET(request:NextRequest){
 if(!(await isAdmin(request)))return NextResponse.json({error:"Administrator access required."},{status:403});
 try{
  const [tasksResponse,membersResponse,projectsResponse]=await Promise.all([
   fetch(URL+"/rest/v1/team_tasks?select=*&order=created_at.desc&limit=300",{headers:headers(),cache:"no-store"}),
   fetch(URL+"/auth/v1/admin/users?page=1&per_page=200",{headers:headers(),cache:"no-store"}),\n   fetch(URL+"/rest/v1/client_projects?select=id,name&order=created_at.desc",{headers:headers(),cache:"no-store"})
  ]);
  const tasks=await tasksResponse.json();const users=await membersResponse.json();
  if(!tasksResponse.ok||!membersResponse.ok)throw new Error("Could not load team assignments.");
  const members=(users.users||[]).filter((u:Record<string,unknown>)=>["marketing","developer","designer"].includes(String((u.app_metadata as Record<string,unknown>|undefined)?.role||""))).map((u:Record<string,unknown>)=>({id:u.id,email:u.email,name:(u.user_metadata as Record<string,unknown>|undefined)?.full_name||u.email,role:(u.app_metadata as Record<string,unknown>|undefined)?.role}));
  return NextResponse.json({tasks,members,projects});
 }catch{return NextResponse.json({error:"Could not load team assignments."},{status:502});}
}
export async function POST(request:NextRequest){
 if(!(await isAdmin(request)))return NextResponse.json({error:"Administrator access required."},{status:403});
 try{
  const input=await request.json();const title=String(input.title||"").trim().slice(0,180);const description=String(input.description||"").trim().slice(0,4000);const department=String(input.department||"");const assignedTo=String(input.assigned_to||"");const priority=String(input.priority||"normal");const dueDate=input.due_date?String(input.due_date):null;const projectId=input.project_id?String(input.project_id):null;
  if(title.length<2||!["marketing","developer","designer"].includes(department)||!assignedTo||!["low","normal","high","urgent"].includes(priority))return NextResponse.json({error:"Complete the task title, team role, assignee and priority."},{status:400});
  const insert=await fetch(URL+"/rest/v1/team_tasks",{method:"POST",headers:headers({"Content-Type":"application/json",Prefer:"return=representation"}),body:JSON.stringify({title,description,department,assigned_to:assignedTo,priority,due_date:dueDate,project_id:projectId,status:"todo"}),cache:"no-store"});
  const result=await insert.json();if(!insert.ok)return NextResponse.json({error:"Task could not be assigned."},{status:502});
  return NextResponse.json({task:result[0],message:"Task assigned successfully."},{status:201});
 }catch{return NextResponse.json({error:"Could not assign task."},{status:500});}
}
