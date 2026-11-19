"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ShieldCheck, UserPlus, Users } from "lucide-react";
type Member={id:string;email:string;name:string;role:string;created_at?:string;last_sign_in_at?:string|null;banned_until?:string|null};
type Task=Record<string,unknown>;
export default function TeamManagementPage(){
 const [token,setToken]=useState("");const [members,setMembers]=useState<Member[]>([]);const [tasks,setTasks]=useState<Task[]>([]);const [projects,setProjects]=useState<Array<{id:string;name:string}>>([]);const [milestones,setMilestones]=useState<Array<{id:string;project_id:string;title:string;status:string;due_date:string|null}>>([]);
 const [form,setForm]=useState({name:"",email:"",password:"",role:"marketing"});
 const [taskForm,setTaskForm]=useState({title:"",description:"",department:"developer",assigned_to:"",priority:"normal",due_date:"",project_id:"",milestone_id:""});
 const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");const [createdCredentials,setCreatedCredentials]=useState<{email:string;password:string;role:string}|null>(null);
 const load=useCallback(async(authToken:string)=>{
  setLoading(true);setError("");
  try{
   const [memberResponse,taskResponse]=await Promise.all([
    fetch("/api/admin/team-members",{headers:{Authorization:"Bearer "+authToken},cache:"no-store"}),
    fetch("/api/admin/team-tasks",{headers:{Authorization:"Bearer "+authToken},cache:"no-store"})
   ]);
   const memberResult=await memberResponse.json();const taskResult=await taskResponse.json();
   if(!memberResponse.ok)throw new Error(memberResult.error||"Could not load team.");
   if(!taskResponse.ok)throw new Error(taskResult.error||"Could not load assignments.");
   setMembers(memberResult.members||[]);setTasks(taskResult.tasks||[]);setProjects(taskResult.projects||[]);setMilestones(taskResult.milestones||[]);
  }catch(e){setError(e instanceof Error?e.message:"Could not load team.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{const saved=sessionStorage.getItem("veltrix-admin-token");if(!saved){window.location.replace("/admin");return;}setToken(saved);void load(saved);},[load]);
 async function create(event:FormEvent){
  event.preventDefault();if(!token)return;setBusy(true);setError("");setNotice("");
  try{const response=await fetch("/api/admin/team-members",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(form)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not create account.");setNotice("Team account created for "+form.email+". Copy the temporary login details and share them privately.");setCreatedCredentials({email:form.email,password:form.password,role:form.role});setForm({name:"",email:"",password:"",role:"marketing"});await load(token);}
  catch(e){setError(e instanceof Error?e.message:"Could not create account.");}finally{setBusy(false);}
 }
 async function assignTask(event:FormEvent){
  event.preventDefault();if(!token)return;setBusy(true);setError("");setNotice("");
  try{const response=await fetch("/api/admin/team-tasks",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(taskForm)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not assign task.");setNotice(result.message||"Task assigned.");setTaskForm({title:"",description:"",department:"developer",assigned_to:"",priority:"normal",due_date:"",project_id:"",milestone_id:""});await load(token);}
  catch(e){setError(e instanceof Error?e.message:"Could not assign task.");}finally{setBusy(false);}
 }
 return <main className="teamShell">
  <header className="teamTop"><Link href="/admin" className="teamBrand">VEL<span>TRIX</span><small> / ADMIN TEAM</small></Link><Link href="/admin" className="teamBack"><ArrowLeft size={15}/> Admin dashboard</Link></header>
  <section className="teamAdminContent">
   <div className="teamPageHead"><div><small>VELTRIX / ADMIN / TEAM</small><h1>Team management.</h1><p>Create team accounts, assign roles and distribute work.</p></div><span className="teamRolePill"><ShieldCheck size={14}/> Admin only</span></div>
   {error&&<div className="teamAlert error">{error}</div>}{notice&&<div className="teamAlert success">{notice}</div>}{createdCredentials&&<div className="teamPanel teamCredentials"><div><b>New {createdCredentials.role} login</b><p>{createdCredentials.email}</p><small>Temporary password: {createdCredentials.password}</small></div><button className="teamRefresh" onClick={()=>navigator.clipboard.writeText("VELTRIX login: "+window.location.origin+"/admin\nEmail: "+createdCredentials.email+"\nTemporary password: "+createdCredentials.password)}>Copy login details</button><button className="teamRefresh" onClick={()=>setCreatedCredentials(null)}>Hide</button></div>}
   <div className="teamGrid">
    <article className="teamPanel"><div className="teamPanelHead"><h2><UserPlus size={18}/> Create team account</h2></div>
     <form className="teamForm" onSubmit={create}>
      <label>Full name<input required minLength={2} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label>Email / login<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      <label>Temporary password (12+ characters)<input required minLength={12} type="password" autoComplete="new-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
      <label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="marketing">Marketing</option><option value="developer">Developer</option><option value="designer">Designer</option></select></label>
      <button disabled={busy}>{busy?"Creating account…":"Create team account"}</button>
     </form><p className="teamMuted">Roles are stored in protected Supabase app metadata, not editable profile metadata.</p>
    </article>
    <article className="teamPanel"><div className="teamPanelHead"><h2><Users size={18}/> Existing team</h2><button className="teamRefresh" onClick={()=>token&&load(token)}><RefreshCw size={14}/> Refresh</button></div>
     {loading?<p className="teamMuted">Loading team accounts…</p>:members.map(member=><div className="teamMember" key={member.id}><div className="teamAvatar small"><Users size={17}/></div><div><b>{member.name||member.email}</b><small>{member.email}</small><small>Last sign-in: {member.last_sign_in_at?new Date(member.last_sign_in_at).toLocaleString():"Not yet"}</small></div><span className="teamRolePill">{member.role}</span></div>)}
     {!loading&&!members.length&&<p className="teamMuted">No team accounts yet.</p>}
    </article>
   </div>
   <article className="teamPanel teamTaskAdmin"><div className="teamPanelHead"><h2>Assign work to your team</h2><span>{tasks.length} tasks</span></div>
    <form className="teamForm" onSubmit={assignTask}>
     <label>Task title<input required minLength={2} value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})}/></label>
     <label>Description<textarea value={taskForm.description} onChange={e=>setTaskForm({...taskForm,description:e.target.value})}/></label>
     <div className="teamFormRow">
      <label>Department<select value={taskForm.department} onChange={e=>setTaskForm({...taskForm,department:e.target.value,assigned_to:""})}><option value="marketing">Marketing</option><option value="developer">Developer</option><option value="designer">Designer</option></select></label>
      <label>Assign to<select required value={taskForm.assigned_to} onChange={e=>setTaskForm({...taskForm,assigned_to:e.target.value})}><option value="">Choose member</option>{members.filter(member=>member.role===taskForm.department).map(member=><option key={member.id} value={member.id}>{member.name||member.email}</option>)}</select></label>
     </div>
     <label>Linked client project<select value={taskForm.project_id} onChange={e=>setTaskForm({...taskForm,project_id:e.target.value,milestone_id:""})}><option value="">No project link</option>{projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select></label>\n     <label>Project milestone<select value={taskForm.milestone_id} disabled={!taskForm.project_id} onChange={e=>setTaskForm({...taskForm,milestone_id:e.target.value})}><option value="">No milestone link</option>{milestones.filter(item=>item.project_id===taskForm.project_id).map(item=><option key={item.id} value={item.id}>{item.title} · {item.status.replace("_"," ")}</option>)}</select></label>
     <div className="teamFormRow">
      <label>Priority<select value={taskForm.priority} onChange={e=>setTaskForm({...taskForm,priority:e.target.value})}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
      <label>Due date<input type="date" value={taskForm.due_date} onChange={e=>setTaskForm({...taskForm,due_date:e.target.value})}/></label>
     </div>
     <button disabled={busy||!members.some(member=>member.role===taskForm.department)}>{busy?"Saving…":"Assign task"}</button>
    </form>
    <div className="teamPanelHead teamAssignedHead"><h2>Recent assignments</h2></div>
    {tasks.slice(0,20).map((task,i)=><div className="teamRow" key={String(task.id||i)}><div><b>{String(task.title||"")}</b><small>{String(task.department||"")} · {String(task.priority||"normal")} · {task.due_date?new Date(String(task.due_date)).toLocaleDateString():"No deadline"}{task.milestone_id? " · "+(milestones.find(m=>m.id===String(task.milestone_id))?.title||"Milestone linked"):""}</small></div><span className={"teamStatus "+String(task.status||"todo")}>{String(task.status||"todo").replace("_"," ")}</span></div>)}
    {!tasks.length&&<p className="teamMuted">No tasks assigned yet.</p>}
   </article>
  </section>
 </main>;
}
