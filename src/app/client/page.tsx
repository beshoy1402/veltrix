"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, LogOut, RefreshCw } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
type Project = { id: string; name: string; summary: string; status: string; progress: number; due_date: string | null };
type Update = { id: string; project_id: string; title: string; body: string; created_at: string };
type Milestone = { id: string; project_id: string; title: string; description: string; status: "pending" | "in_progress" | "completed" | "blocked"; due_date: string | null; sort_order: number };

export default function ClientPortal() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [token,setToken]=useState("");
  const [projects,setProjects]=useState<Project[]>([]);
  const [updates,setUpdates]=useState<Update[]>([]);
  const [milestones,setMilestones]=useState<Milestone[]>([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  async function load(authToken:string){
    setLoading(true);setError("");
    try{
      const response=await fetch(`${API}/rest/v1/client_projects?select=*&order=created_at.desc`,{headers:{apikey:KEY??"",Authorization:`Bearer ${authToken}`}});
      if(!response.ok)throw new Error("Could not load your projects. Please contact the VELTRIX team.");
      const rows:Project[]=await response.json();setProjects(rows);
      if(rows.length){
        const ids=rows.map(x=>x.id).join(",");
        const u=await fetch(`${API}/rest/v1/project_updates?select=*&project_id=in.(${ids})&order=created_at.desc`,{headers:{apikey:KEY??"",Authorization:`Bearer ${authToken}`}});
        if(!u.ok)throw new Error("Projects loaded, but the update timeline could not be loaded.");
        setUpdates(await u.json());
        const m=await fetch(`${API}/rest/v1/project_milestones?select=*&project_id=in.(${ids})&order=sort_order.asc,due_date.asc.nullslast`,{headers:{apikey:KEY??"",Authorization:`Bearer ${authToken}`}});
        if(!m.ok)throw new Error("Projects loaded, but milestones could not be loaded.");
        setMilestones(await m.json());
      }else {setUpdates([]);setMilestones([]);}
    }catch(e){setError(e instanceof Error?e.message:"Unable to load portal.");}
    finally{setLoading(false);}
  }

  async function authenticate(authToken:string){
    const response=await fetch(`${API}/auth/v1/user`,{headers:{apikey:KEY??"",Authorization:`Bearer ${authToken}`}});
    if(!response.ok)throw new Error("Your session has expired. Please sign in again.");
    setToken(authToken);sessionStorage.setItem("veltrix-client-token",authToken);
    await load(authToken);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{const saved=sessionStorage.getItem("veltrix-client-token");if(saved)authenticate(saved).catch(()=>{sessionStorage.removeItem("veltrix-client-token");setToken("");});},[]);

  async function signIn(event:FormEvent){
    event.preventDefault();setLoading(true);setError("");
    try{
      const response=await fetch(`${API}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:KEY??"","Content-Type":"application/json"},body:JSON.stringify({email,password})});
      const result=await response.json();
      if(!response.ok||!result.access_token)throw new Error(result.msg||result.message||"Invalid email or password.");
      await authenticate(result.access_token);
    }catch(e){setError(e instanceof Error?e.message:"Sign in failed.");}
    finally{setLoading(false);}
  }

  function signOut(){sessionStorage.removeItem("veltrix-client-token");setToken("");setProjects([]);setUpdates([]);setMilestones([]);setPassword("");}

  if(!token)return <main className="portalShell"><Link className="adminBack" href="/"><ArrowLeft size={16}/> Back to VELTRIX</Link><form className="adminLogin" onSubmit={signIn}><div className="adminMark">V/</div><small>VELTRIX / CLIENT PORTAL</small><h1>Your project,<br/>in focus.</h1><p>Sign in using the email and password provided by your project manager.</p><label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username"/></label><label>Password<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label>{error&&<div className="adminError">{error}</div>}<button className="adminPrimary" disabled={loading}>{loading?"Signing in...":"Open client portal"}</button><small className="adminHint">Need access? Ask your VELTRIX project manager to invite your account.</small></form></main>;

  return <main className="portalShell"><header className="adminTop"><Link className="adminBrand" href="/">VEL<span>TRIX</span><small> / CLIENT PORTAL</small></Link><div><button onClick={()=>load(token)} className="adminIcon" aria-label="Refresh"><RefreshCw size={16}/></button><button onClick={signOut} className="adminLogout"><LogOut size={15}/> Sign out</button></div></header><section className="portalContent"><div className="portalIntro"><small>YOUR VELTRIX WORKSPACE</small><h1>Project overview.</h1><p>Track milestones, progress and updates from your VELTRIX team.</p></div>{error&&<div className="adminError">{error}</div>}{loading&&<p className="adminSub">Loading your workspace…</p>}{!loading&&!projects.length&&<div className="adminPanel"><h2>No projects linked yet</h2><p className="adminSub">Your account is active. Once the VELTRIX team links a project to your account, it will appear here.</p></div>}{projects.map(p=><article className="portalProject" key={p.id}><div className="portalProjectHead"><div><small>{p.status.replace("_"," ").toUpperCase()}</small><h2>{p.name}</h2><p>{p.summary}</p></div><span>{p.due_date?new Date(p.due_date).toLocaleDateString():"Schedule pending"}</span></div><div className="progressMeta"><b>Project progress</b><strong>{p.progress}%</strong></div><div className="progressTrack"><i style={{width:`${p.progress}%`}}/></div><div className="portalMilestones"><h3>Project milestones</h3>{milestones.filter(m=>m.project_id===p.id).map(m=><div className="portalMilestone" key={m.id}><span className={"portalMilestoneMark "+m.status}>{m.status==="completed"?"✓":m.status==="blocked"?"!":"•"}</span><div><b>{m.title}</b><small>{m.due_date?"Due "+new Date(m.due_date+"T00:00:00").toLocaleDateString():"No due date"} · {m.status.replace("_"," ")}</small>{m.description&&<p>{m.description}</p>}</div></div>)}{!milestones.some(m=>m.project_id===p.id)&&<p className="adminSub">Milestones will appear here when your project manager adds them.</p>}</div><div className="portalTimeline"><h3>Latest updates</h3>{updates.filter(u=>u.project_id===p.id).map(u=><div className="portalUpdate" key={u.id}><i/><div><b>{u.title}</b><small>{new Date(u.created_at).toLocaleString()}</small><p>{u.body}</p></div></div>)}{!updates.some(u=>u.project_id===p.id)&&<p className="adminSub">No updates have been posted yet.</p>}</div></article>)}</section></main>;
}
