"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, Code2, LogOut, Megaphone, Palette, RefreshCw } from "lucide-react";

type Role = "marketing" | "developer" | "designer";
type Task = { id: string; title: string; description: string; status: string; priority: string; due_date: string | null; department: string; project_id?: string | null; milestone_id?: string | null };
type Milestone = { id: string; project_id: string; title: string; status: string; due_date: string | null; sort_order: number };
type Item = Record<string, unknown>;
type WorkspaceData = { role: Role; profile: { id: string; email: string; name: string }; tasks: Task[]; announcements: Item[]; inquiries?: Item[]; activities?: Item[]; campaigns?: Item[]; assets?: Item[]; projects?: Item[]; milestones?: Milestone[] };
type LeadDraft = { body: string; due_at: string; activity_type: string };

const config = {
  marketing: { title: "Marketing Studio", subtitle: "Turn conversations into customers.", icon: Megaphone, accent: "Marketing / Growth", sections: ["Overview", "Leads", "Campaigns", "Follow-ups"] },
  developer: { title: "Developer Workspace", subtitle: "Build, ship and maintain exceptional digital products.", icon: Code2, accent: "Engineering / Delivery", sections: ["Overview", "My tasks", "Projects", "Technical notes"] },
  designer: { title: "Design Studio", subtitle: "Shape thoughtful digital experiences.", icon: Palette, accent: "Creative / Design", sections: ["Overview", "My tasks", "Design library", "Reviews"] },
} as const;

export default function TeamWorkspace({ expectedRole }: { expectedRole: Role }) {
  const [token, setToken] = useState("");
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [section, setSection] = useState("Overview");
  const [campaign, setCampaign] = useState({ name: "", channel: "Instagram", budget_egp: "0", notes: "" });
  const [asset, setAsset] = useState({ name: "", description: "", file_url: "" });
  const [busy, setBusy] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");
  const [leadDrafts, setLeadDrafts] = useState<Record<string, LeadDraft>>({});
  const current = config[expectedRole];
  const Icon = current.icon;

  const load = useCallback(async (authToken: string) => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/team/workspace", { headers: { Authorization: "Bearer " + authToken }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Workspace could not be loaded.");
      if (result.role !== expectedRole) throw new Error("This account is not assigned to this workspace.");
      setData(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Workspace unavailable."); }
    finally { setLoading(false); }
  }, [expectedRole]);

  useEffect(() => {
    const saved = sessionStorage.getItem("veltrix-admin-token");
    if (!saved) { window.location.replace("/admin"); return; }
    setToken(saved);
    void load(saved);
  }, [load]);

  function signOut() {
    sessionStorage.removeItem("veltrix-admin-token");
    setToken("");
    window.location.replace("/admin");
  }

  async function updateTask(task: Task, status: string) {
    if (!token) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/team/workspace", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ id: task.id, status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Task update failed.");
      setNotice(result.message || "Task updated."); await load(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Task update failed."); }
    finally { setBusy(false); }
  }

  async function updateLead(lead: Item, status: string) {
    if (!token || expectedRole !== "marketing") return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/team/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ kind: "lead_status", id: String(lead.id || ""), status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Lead could not be updated.");
      setNotice(result.message || "Lead updated.");
      await load(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Lead could not be updated."); }
    finally { setBusy(false); }
  }

  async function addLeadActivity(event: React.FormEvent<HTMLFormElement>, lead: Item) {
    event.preventDefault();
    if (!token || expectedRole !== "marketing") return;
    const id = String(lead.id || "");
    const draft = leadDrafts[id] || { body: "", due_at: "", activity_type: "note" };
    if (draft.body.trim().length < 2) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/team/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ kind: "lead_activity", inquiry_id: id, body: draft.body, due_at: draft.due_at || null, activity_type: draft.activity_type }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "CRM activity could not be saved.");
      setLeadDrafts(current => ({ ...current, [id]: { body: "", due_at: "", activity_type: "note" } }));
      setNotice(result.message || "CRM activity saved.");
      await load(token);
    } catch (e) { setError(e instanceof Error ? e.message : "CRM activity could not be saved."); }
    finally { setBusy(false); }
  }

  async function createItem(event: React.FormEvent) {
    event.preventDefault(); if (!token) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const payload = expectedRole === "marketing" ? { kind: "campaign", ...campaign, budget_egp: Number(campaign.budget_egp) } : { kind: "asset", ...asset };
      const response = await fetch("/api/team/workspace", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save.");
      setNotice(result.message || "Saved.");
      if (expectedRole === "marketing") setCampaign({ name: "", channel: "Instagram", budget_egp: "0", notes: "" });
      else setAsset({ name: "", description: "", file_url: "" });
      await load(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save."); }
    finally { setBusy(false); }
  }

  const tasks = data?.tasks || [];
  const done = tasks.filter(task => task.status === "done").length;
  const open = tasks.filter(task => task.status !== "done").length;

  return <main className="teamShell">
    <header className="teamTop"><Link href="/" className="teamBrand">VEL<span>TRIX</span><small> / TEAM WORKSPACE</small></Link><div className="teamTopActions"><span>{data?.profile.name || data?.profile.email || "Team member"}</span><button onClick={() => token && load(token)} aria-label="Refresh"><RefreshCw size={16}/></button><button onClick={signOut}><LogOut size={15}/> Sign out</button></div></header>
    <div className="teamLayout">
      <aside className="teamSide"><div className="teamIdentity"><div className="teamAvatar"><Icon size={22}/></div><small>{current.accent}</small><h2>{current.title}</h2></div>{current.sections.map(item => <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{item}</button>)}<Link href="/admin">Admin login</Link></aside>
      <section className="teamMain">
        <div className="teamPageHead"><div><small>VELTRIX / {expectedRole.toUpperCase()}</small><h1>{section === "Overview" ? current.title : section}</h1><p>{current.subtitle}</p></div><span className="teamRolePill">{expectedRole}</span></div>
        {error && <div className="teamAlert error">{error}</div>}{notice && <div className="teamAlert success"><CheckCircle2 size={16}/>{notice}</div>}
        {loading && <div className="teamPanel">Loading your workspace…</div>}
        {!loading && data && section === "Overview" && <>
          <div className="teamStats"><article><small>Assigned tasks</small><strong>{tasks.length}</strong></article><article><small>Open tasks</small><strong>{open}</strong></article><article><small>Completed</small><strong>{done}</strong></article><article><small>Announcements</small><strong>{data.announcements.length}</strong></article></div>
          <div className="teamGrid"><article className="teamPanel"><div className="teamPanelHead"><h2>Priority work</h2><span>{open} open</span></div>{tasks.slice(0,5).map(task => <div className="teamRow" key={task.id}><div><b>{task.title}</b><small>{task.description || "No additional details"}</small></div><span className={"teamStatus " + task.status}>{task.status.replace("_"," ")}</span></div>)}{!tasks.length && <p className="teamMuted">No tasks assigned yet. Your admin can assign work from Team Management.</p>}</article><article className="teamPanel"><div className="teamPanelHead"><h2>Team announcements</h2><Bell size={17}/></div>{data.announcements.map((item,i)=><div className="teamAnnouncement" key={String(item.id || i)}><b>{String(item.title || "Announcement")}</b><p>{String(item.body || "")}</p><small>{item.created_at ? new Date(String(item.created_at)).toLocaleString() : ""}</small></div>)}{!data.announcements.length && <p className="teamMuted">No announcements yet.</p>}</article></div>
        </>}
        {!loading && data && (section === "My tasks" || section === "Technical notes") && <div className="teamPanel"><div className="teamPanelHead"><h2>My assigned tasks</h2><span>{tasks.length} total</span></div>{tasks.map(task=><div className="teamTask" key={task.id}><div><b>{task.title}</b><p>{task.description}</p><small>{task.priority.toUpperCase()} · {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No deadline"}{task.milestone_id ? " · "+(data.milestones||[]).find(m=>m.id===task.milestone_id)?.title : ""}</small></div><select value={task.status} disabled={busy} onChange={e=>updateTask(task,e.target.value)}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="review">Ready for review</option><option value="done">Completed</option></select></div>)}{!tasks.length&&<p className="teamMuted">No tasks assigned yet.</p>}</div>}
        {!loading && data && section === "Leads" && <div className="teamPanel">
          <div className="teamPanelHead"><h2>CRM · Lead pipeline</h2><span>{data.inquiries?.length || 0} leads</span></div>
          <div className="teamStats">{["new","contacted","qualified","won"].map(status=><article key={status}><small>{status.replace("_"," ")}</small><strong>{(data.inquiries || []).filter(item=>String(item.status||"new")===status).length}</strong></article>)}</div>
          <div className="teamLeadToolbar"><input aria-label="Search leads" placeholder="Search name, email, company or service…" value={leadSearch} onChange={e=>setLeadSearch(e.target.value)}/><select aria-label="Filter leads by status" value={leadFilter} onChange={e=>setLeadFilter(e.target.value)}><option value="all">All statuses</option>{["new","contacted","qualified","won","lost","archived"].map(status=><option key={status} value={status}>{status}</option>)}</select></div>
          {(data.inquiries || []).filter(item=>{
            const status=String(item.status||"new");
            const query=leadSearch.trim().toLowerCase();
            const matchesStatus=leadFilter==="all"||status===leadFilter;
            const matchesQuery=!query||[item.name,item.email,item.company,item.service_interest].some(value=>String(value||"").toLowerCase().includes(query));
            return matchesStatus&&matchesQuery;
          }).map(item=>{
            const id=String(item.id||"");
            const draft=leadDrafts[id]||{body:"",due_at:"",activity_type:"note"};
            const activities=(data.activities||[]).filter(activity=>String(activity.inquiry_id)===id);
            return <article className="teamLeadCard" key={id}>
              <div className="teamRow">
                <div><b>{String(item.name || "New lead")}</b><small>{String(item.email || "")} · {String(item.company || "No company")} · {String(item.service_interest || "General enquiry")} · {String(item.budget || "Budget not specified")}</small></div>
                <select aria-label={"Update lead status for "+String(item.name||"lead")} value={String(item.status||"new")} disabled={busy} onChange={e=>void updateLead(item,e.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="won">Won</option><option value="lost">Lost</option><option value="archived">Archived</option></select>
              </div>
              <form className="teamLeadActivity" onSubmit={e=>void addLeadActivity(e,item)}>
                <select aria-label="Activity type" value={draft.activity_type} onChange={e=>setLeadDrafts(current=>({...current,[id]:{...draft,activity_type:e.target.value}}))}><option value="note">Note</option><option value="follow_up">Follow-up</option><option value="call">Call</option><option value="email">Email</option><option value="meeting">Meeting</option></select>
                <input aria-label="CRM note or follow-up" placeholder="Add a note or follow-up detail…" value={draft.body} onChange={e=>setLeadDrafts(current=>({...current,[id]:{...draft,body:e.target.value}}))} maxLength={2000}/>
                <input aria-label="Follow-up date" type="datetime-local" value={draft.due_at} onChange={e=>setLeadDrafts(current=>({...current,[id]:{...draft,due_at:e.target.value}}))}/>
                <button type="submit" disabled={busy||draft.body.trim().length<2}>Save activity</button>
              </form>
              {activities.length>0&&<div className="teamLeadHistory"><b>Activity history</b>{activities.slice(0,4).map(activity=><div key={String(activity.id)}><span>{String(activity.activity_type).replace("_"," ")}</span><p>{String(activity.body)}</p><small>{activity.due_at?("Follow up: "+new Date(String(activity.due_at)).toLocaleString()+" · "):""}{new Date(String(activity.created_at)).toLocaleString()}</small></div>)}</div>}
            </article>;
          })}
          {!data.inquiries?.length&&<p className="teamMuted">No leads available.</p>}
        </div>}
        {!loading && data && section === "Campaigns" && <div className="teamGrid"><article className="teamPanel"><h2>Create campaign</h2><form className="teamForm" onSubmit={createItem}><label>Campaign name<input required value={campaign.name} onChange={e=>setCampaign({...campaign,name:e.target.value})}/></label><label>Channel<select value={campaign.channel} onChange={e=>setCampaign({...campaign,channel:e.target.value})}><option>Instagram</option><option>Facebook</option><option>Website</option><option>Referral</option><option>Google</option><option>Other</option></select></label><label>Budget (EGP)<input type="number" min="0" value={campaign.budget_egp} onChange={e=>setCampaign({...campaign,budget_egp:e.target.value})}/></label><label>Notes<textarea value={campaign.notes} onChange={e=>setCampaign({...campaign,notes:e.target.value})}/></label><button disabled={busy}>Create campaign</button></form></article><article className="teamPanel"><h2>Campaign list</h2>{(data.campaigns || []).map((item,i)=><div className="teamRow" key={String(item.id || i)}><div><b>{String(item.name || "")}</b><small>{String(item.channel || "")} · EGP {String(item.budget_egp || 0)}</small></div><span className={"teamStatus " + String(item.status || "draft")}>{String(item.status || "draft")}</span></div>)}{!data.campaigns?.length&&<p className="teamMuted">No campaigns created.</p>}</article></div>}
        {!loading && data && section === "Design library" && <div className="teamGrid"><article className="teamPanel"><h2>Add design item</h2><form className="teamForm" onSubmit={createItem}><label>Asset / project name<input required value={asset.name} onChange={e=>setAsset({...asset,name:e.target.value})}/></label><label>Description<textarea value={asset.description} onChange={e=>setAsset({...asset,description:e.target.value})}/></label><label>Figma or file link<input type="url" value={asset.file_url} onChange={e=>setAsset({...asset,file_url:e.target.value})}/></label><button disabled={busy}>Save design item</button></form></article><article className="teamPanel"><h2>Design library</h2>{(data.assets || []).map((item,i)=><div className="teamRow" key={String(item.id || i)}><div><b>{String(item.name || "")}</b><small>{String(item.description || "")}</small>{Boolean(item.file_url)&&<a href={String(item.file_url)} target="_blank" rel="noreferrer">Open design ↗</a>}</div><span className={"teamStatus " + String(item.status || "working")}>{String(item.status || "working")}</span></div>)}{!data.assets?.length&&<p className="teamMuted">No design items yet.</p>}</article></div>}
        {!loading && data && section === "Projects" && <div className="teamPanel"><h2>Development projects</h2>{(data.projects || []).map((item,i)=>{const projectId=String(item.id||"");const projectTasks=tasks.filter(task=>task.project_id===projectId);const projectMilestones=(data.milestones||[]).filter(m=>m.project_id===projectId);return <article className="teamProjectDelivery" key={String(item.id||i)}><div className="teamRow"><div><b>{String(item.name || "")}</b><small>{String(item.summary || "")}</small></div><span className="teamStatus">{String(item.status || "")} · {String(item.progress || 0)}%</span></div><div className="teamDeliveryMeta"><b>Milestones</b><span>{projectMilestones.filter(m=>m.status==="completed").length}/{projectMilestones.length} completed</span></div>{projectMilestones.map(m=><div className="teamMilestoneRow" key={m.id}><span className={"teamMilestoneDot "+m.status}/><div><b>{m.title}</b><small>{m.status.replace("_"," ")}{m.due_date?" · Due "+new Date(m.due_date+"T00:00:00").toLocaleDateString():""}</small></div></div>)}{projectTasks.length>0&&<div className="teamProjectTasks"><b>My tasks for this project</b>{projectTasks.map(task=><div key={task.id}><span>{task.title}</span><small>{task.status.replace("_"," ")}</small></div>)}</div>}</article>})}{!data.projects?.length&&<p className="teamMuted">Project records appear here when assigned.</p>}</div>}
        {!loading && data && section === "Follow-ups" && <div className="teamPanel"><div className="teamPanelHead"><h2>Scheduled follow-ups</h2><span>{(data.activities || []).filter(activity=>Boolean(activity.due_at)).length} scheduled</span></div><p className="teamMuted">Follow-ups saved from the Leads pipeline appear here, ordered by due date. Overdue items are marked so they are easy to spot.</p>{[...(data.activities || [])].filter(activity=>Boolean(activity.due_at)).sort((a,b)=>new Date(String(a.due_at)).getTime()-new Date(String(b.due_at)).getTime()).map(activity=>{const lead=(data.inquiries || []).find(item=>String(item.id)===String(activity.inquiry_id));const overdue=new Date(String(activity.due_at)).getTime()<Date.now();return <div className="teamFollowupRow" key={String(activity.id)}><div><b>{String(lead?.name || "Lead")}</b><small>{String(lead?.email || "")} · {String(activity.activity_type || "follow_up").replace("_"," ")}</small><p>{String(activity.body || "")}</p></div><div className="teamFollowupDue"><span className={"teamStatus "+(overdue?"urgent":"in_progress")}>{overdue?"Overdue":"Upcoming"}</span><small>{new Date(String(activity.due_at)).toLocaleString()}</small></div></div>})}{!(data.activities || []).some(activity=>Boolean(activity.due_at))&&<p className="teamMuted">No scheduled follow-ups yet. Add a follow-up date to any lead in the Leads section.</p>}</div>}
        {!loading && data && section === "Reviews" && <div className="teamPanel"><h2>Design reviews</h2><p className="teamMuted">Design records awaiting review appear here.</p>{(data.assets || []).filter(x=>x.status==="review").map((item,i)=><div className="teamRow" key={String(item.id || i)}><b>{String(item.name || "")}</b><span className="teamStatus review">Review</span></div>)}</div>}
      </section>
    </div>
  </main>;
}
