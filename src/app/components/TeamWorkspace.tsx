"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, Code2, LogOut, Megaphone, Palette, RefreshCw } from "lucide-react";

type Role = "marketing" | "developer" | "designer";
type Task = { id: string; title: string; description: string; status: string; priority: string; due_date: string | null; department: string };
type Item = Record<string, unknown>;
type WorkspaceData = { role: Role; profile: { id: string; email: string; name: string }; tasks: Task[]; announcements: Item[]; inquiries?: Item[]; campaigns?: Item[]; assets?: Item[]; projects?: Item[] };

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
        {!loading && data && (section === "My tasks" || section === "My tasks" || section === "Technical notes") && <div className="teamPanel"><div className="teamPanelHead"><h2>My assigned tasks</h2><span>{tasks.length} total</span></div>{tasks.map(task=><div className="teamTask" key={task.id}><div><b>{task.title}</b><p>{task.description}</p><small>{task.priority.toUpperCase()} · {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No deadline"}</small></div><select value={task.status} disabled={busy} onChange={e=>updateTask(task,e.target.value)}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="review">Ready for review</option><option value="done">Completed</option></select></div>)}{!tasks.length&&<p className="teamMuted">No tasks assigned yet.</p>}</div>}
        {!loading && data && section === "Leads" && <div className="teamPanel"><div className="teamPanelHead"><h2>Recent customer leads</h2><span>{data.inquiries?.length || 0} leads</span></div>{(data.inquiries || []).map(item=><div className="teamRow" key={String(item.id)}><div><b>{String(item.name || "New lead")}</b><small>{String(item.email || "")} · {String(item.service_interest || "General enquiry")} · {String(item.budget || "Budget not specified")}</small></div><span className={"teamStatus " + String(item.status || "new")}>{String(item.status || "new")}</span></div>)}{!data.inquiries?.length&&<p className="teamMuted">No leads available.</p>}</div>}
        {!loading && data && section === "Campaigns" && <div className="teamGrid"><article className="teamPanel"><h2>Create campaign</h2><form className="teamForm" onSubmit={createItem}><label>Campaign name<input required value={campaign.name} onChange={e=>setCampaign({...campaign,name:e.target.value})}/></label><label>Channel<select value={campaign.channel} onChange={e=>setCampaign({...campaign,channel:e.target.value})}><option>Instagram</option><option>Facebook</option><option>Website</option><option>Referral</option><option>Google</option><option>Other</option></select></label><label>Budget (EGP)<input type="number" min="0" value={campaign.budget_egp} onChange={e=>setCampaign({...campaign,budget_egp:e.target.value})}/></label><label>Notes<textarea value={campaign.notes} onChange={e=>setCampaign({...campaign,notes:e.target.value})}/></label><button disabled={busy}>Create campaign</button></form></article><article className="teamPanel"><h2>Campaign list</h2>{(data.campaigns || []).map((item,i)=><div className="teamRow" key={String(item.id || i)}><div><b>{String(item.name || "")}</b><small>{String(item.channel || "")} · EGP {String(item.budget_egp || 0)}</small></div><span className={"teamStatus " + String(item.status || "draft")}>{String(item.status || "draft")}</span></div>)}{!data.campaigns?.length&&<p className="teamMuted">No campaigns created.</p>}</article></div>}
        {!loading && data && section === "Design library" && <div className="teamGrid"><article className="teamPanel"><h2>Add design item</h2><form className="teamForm" onSubmit={createItem}><label>Asset / project name<input required value={asset.name} onChange={e=>setAsset({...asset,name:e.target.value})}/></label><label>Description<textarea value={asset.description} onChange={e=>setAsset({...asset,description:e.target.value})}/></label><label>Figma or file link<input type="url" value={asset.file_url} onChange={e=>setAsset({...asset,file_url:e.target.value})}/></label><button disabled={busy}>Save design item</button></form></article><article className="teamPanel"><h2>Design library</h2>{(data.assets || []).map((item,i)=><div className="teamRow" key={String(item.id || i)}><div><b>{String(item.name || "")}</b><small>{String(item.description || "")}</small>{item.file_url&&<a href={String(item.file_url)} target="_blank" rel="noreferrer">Open design ↗</a>}</div><span className={"teamStatus " + String(item.status || "working")}>{String(item.status || "working")}</span></div>)}{!data.assets?.length&&<p className="teamMuted">No design items yet.</p>}</article></div>}
        {!loading && data && section === "Projects" && <div className="teamPanel"><h2>Development projects</h2>{(data.projects || []).map((item,i)=><div className="teamRow" key={String(item.id || i)}><div><b>{String(item.name || "")}</b><small>{String(item.summary || "")}</small></div><span className="teamStatus">{String(item.status || "")} · {String(item.progress || 0)}%</span></div>)}{!data.projects?.length&&<p className="teamMuted">Project records appear here when assigned.</p>}</div>}
        {!loading && data && section === "Follow-ups" && <div className="teamPanel"><h2>Follow-up queue</h2><p className="teamMuted">Use lead records to coordinate the next customer contact. Dedicated reminder scheduling is planned for a later phase.</p>{(data.inquiries || []).filter(x=>x.status==="new"||x.status==="contacted").map(item=><div className="teamRow" key={String(item.id)}><div><b>{String(item.name || "")}</b><small>{String(item.email || "")} · {String(item.phone || "")}</small></div><span className={"teamStatus " + String(item.status)}>{String(item.status)}</span></div>)}</div>}
        {!loading && data && section === "Reviews" && <div className="teamPanel"><h2>Design reviews</h2><p className="teamMuted">Design records awaiting review appear here.</p>{(data.assets || []).filter(x=>x.status==="review").map((item,i)=><div className="teamRow" key={String(item.id || i)}><b>{String(item.name || "")}</b><span className="teamStatus review">Review</span></div>)}</div>}
      </section>
    </div>
  </main>;
}
