"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ShieldCheck, UserPlus, Users } from "lucide-react";

type Member = { id: string; email: string; name: string; role: string; created_at?: string; last_sign_in_at?: string | null; banned_until?: string | null };

export default function TeamManagementPage() {
  const [token,setToken]=useState("");
  const [members,setMembers]=useState<Member[]>([]);
  const [form,setForm]=useState({name:"",email:"",password:"",role:"marketing"});
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const load=useCallback(async(authToken:string)=>{
    setLoading(true);setError("");
    try{const response=await fetch("/api/admin/team-members",{headers:{Authorization:"Bearer "+authToken},cache:"no-store"});const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not load team.");setMembers(result.members||[]);}
    catch(e){setError(e instanceof Error?e.message:"Could not load team.");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{const saved=sessionStorage.getItem("veltrix-admin-token");if(!saved){window.location.replace("/admin");return;}setToken(saved);void load(saved);},[load]);
  async function create(event:FormEvent){event.preventDefault();if(!token)return;setBusy(true);setError("");setNotice("");try{const response=await fetch("/api/admin/team-members",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify(form)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not create account.");setNotice("Team account created for "+form.email+". Copy the temporary password now and share it privately.");setForm({name:"",email:"",password:"",role:"marketing"});await load(token);}catch(e){setError(e instanceof Error?e.message:"Could not create account.");}finally{setBusy(false);}}
  return <main className="teamShell"><header className="teamTop"><Link href="/admin" className="teamBrand">VEL<span>TRIX</span><small> / ADMIN TEAM</small></Link><Link href="/admin" className="teamBack"><ArrowLeft size={15}/> Admin dashboard</Link></header><section className="teamAdminContent"><div className="teamPageHead"><div><small>VELTRIX / ADMIN / TEAM</small><h1>Team management.</h1><p>Create individual accounts for marketing, developers and designers.</p></div><span className="teamRolePill"><ShieldCheck size={14}/> Admin only</span></div>{error&&<div className="teamAlert error">{error}</div>}{notice&&<div className="teamAlert success">{notice}</div>}<div className="teamGrid"><article className="teamPanel"><div className="teamPanelHead"><h2><UserPlus size={18}/> Create team account</h2></div><form className="teamForm" onSubmit={create}><label>Full name<input required minLength={2} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Email / login<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Temporary password (12+ characters)<input required minLength={12} type="password" autoComplete="new-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="marketing">Marketing</option><option value="developer">Developer</option><option value="designer">Designer</option></select></label><button disabled={busy}>{busy?"Creating account…":"Create team account"}</button></form><p className="teamMuted">Team roles are stored in protected Supabase app metadata, not editable profile metadata.</p></article><article className="teamPanel"><div className="teamPanelHead"><h2><Users size={18}/> Existing team</h2><button className="teamRefresh" onClick={()=>token&&load(token)}><RefreshCw size={14}/> Refresh</button></div>{loading?<p className="teamMuted">Loading team accounts…</p>:members.map(member=><div className="teamMember" key={member.id}><div className="teamAvatar small"><Users size={17}/></div><div><b>{member.name||member.email}</b><small>{member.email}</small><small>Last sign-in: {member.last_sign_in_at?new Date(member.last_sign_in_at).toLocaleString():"Not yet"}</small></div><span className="teamRolePill">{member.role}</span></div>)}{!loading&&!members.length&&<p className="teamMuted">No team accounts yet.</p>}</article></div></section></main>;
}
