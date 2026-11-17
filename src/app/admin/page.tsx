"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
type Row = { id: string; name?: string; email?: string; phone?: string; company?: string; service_interest?: string; budget?: string; message?: string; preferred_date?: string | null; preferred_time?: string; notes?: string; status?: string; category?: string; description?: string; price_egp?: number | string; is_published?: boolean; sort_order?: number; client_user_id?: string; summary?: string; due_date?: string | null; progress?: number; created_at?: string; path?: string; event_type?: string; session_id?: string; [key: string]: unknown };
type Tab = "overview" | "inquiries" | "services" | "bookings" | "newsletter" | "projects";

async function api(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${API}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: KEY ?? "",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<Record<string, Row[]>>({ inquiries: [], services: [], bookings: [], newsletter: [], projects: [], events: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [project, setProject] = useState({ client_user_id: "", name: "", summary: "", due_date: "" });
  const [newService, setNewService] = useState({ category: "Business Websites", name: "", description: "", price_egp: "20000" });
  const [updateDraft, setUpdateDraft] = useState({ project_id: "", title: "", body: "" });

  async function loadAll(authToken: string) {
    setLoading(true); setError("");
    try {
      const [inquiries, services, bookings, newsletter, projects, events] = await Promise.all([
        api("inquiries?select=*&order=created_at.desc", authToken),
        api("services?select=*&order=sort_order.asc", authToken),
        api("booking_requests?select=*&order=created_at.desc", authToken),
        api("newsletter_subscribers?select=*&order=created_at.desc", authToken),
        api("client_projects?select=*&order=created_at.desc", authToken),
        api("site_events?select=*&order=created_at.desc&limit=500", authToken),
      ]);
      setData({ inquiries, services, bookings, newsletter, projects, events });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load dashboard data."); }
    finally { setLoading(false); }
  }

  async function verify(authToken: string) {
    const response = await fetch(`${API}/auth/v1/user`, { headers: { apikey: KEY ?? "", Authorization: `Bearer ${authToken}` } });
    if (!response.ok) throw new Error("Session expired. Please sign in again.");
    const user = await response.json();
    if (user?.app_metadata?.role !== "admin") throw new Error("This account does not have administrator access.");
    setToken(authToken); sessionStorage.setItem("veltrix-admin-token", authToken);
    await loadAll(authToken);
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("veltrix-admin-token");
    if (saved) verify(saved).catch(() => { sessionStorage.removeItem("veltrix-admin-token"); setToken(""); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/auth/v1/token?grant_type=password`, {
        method: "POST", headers: { apikey: KEY ?? "", "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.access_token) throw new Error(result.msg || result.message || "Invalid email or password.");
      await verify(result.access_token);
    } catch (e) { setError(e instanceof Error ? e.message : "Sign in failed."); }
    finally { setLoading(false); }
  }

  function signOut() { sessionStorage.removeItem("veltrix-admin-token"); setToken(""); setPassword(""); setData({ inquiries: [], services: [], bookings: [], newsletter: [], projects: [], events: [] }); }

  async function patch(table: string, id: string, values: Record<string, unknown>) {
    setError(""); setMessage("");
    try {
      await api(`${table}?id=eq.${encodeURIComponent(id)}`, token, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(values) });
      setMessage("Changes saved."); await loadAll(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
  }

  async function addService(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      await api("services", token, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ...newService, price_egp: Number(newService.price_egp), is_published: true, sort_order: data.services.length + 1 }) });
      setNewService({ category: "Websites", name: "", description: "", price_egp: "20000" }); setMessage("Service added."); await loadAll(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not add service."); }
  }

  async function addProjectUpdate(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      await api("project_updates", token, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(updateDraft) });
      setUpdateDraft({ project_id: "", title: "", body: "" }); setMessage("Project update posted."); await loadAll(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not post update."); }
  }

  async function addProject(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      await api("client_projects", token, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ...project, due_date: project.due_date || null, status: "planning", progress: 0 }) });
      setProject({ client_user_id: "", name: "", summary: "", due_date: "" }); setMessage("Client project created."); await loadAll(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create project."); }
  }

  const pageViews = data.events.filter(x => x.event_type === "page_view");
  const uniqueVisitors = new Set(pageViews.map(x => x.session_id).filter(Boolean)).size;
  const topPages = Object.entries(pageViews.reduce((acc: Record<string, number>, x) => { const path = x.path || "/"; acc[path] = (acc[path] || 0) + 1; return acc; }, {})).sort((a,b) => b[1]-a[1]).slice(0,5);
  const counts = [
    ["New enquiries", data.inquiries.filter(x => x.status === "new").length],
    ["Pending bookings", data.bookings.filter(x => x.status === "pending").length],
    ["Active projects", data.projects.filter(x => !["completed", "on_hold"].includes(x.status ?? "")).length],
    ["Subscribers", data.newsletter.filter(x => x.status === "active").length],
    ["Page views", pageViews.length],
  ];

  if (!token) return <main className="adminShell"><Link className="adminBack" href="/"><ArrowLeft size={16}/> Back to VELTRIX</Link><form className="adminLogin" onSubmit={signIn}><div className="adminMark"><ShieldCheck size={25}/></div><small>VELTRIX / PRIVATE AREA</small><h1>Studio administration.</h1><p>Sign in with your Supabase administrator account.</p><label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="username"/></label><label>Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"/></label>{error && <div className="adminError">{error}</div>}<button className="adminPrimary" disabled={loading}>{loading ? "Signing in..." : "Sign in securely"}</button><small className="adminHint">Access is controlled by the administrator role in Supabase app metadata.</small></form></main>;

  return <main className="adminShell"><header className="adminTop"><Link className="adminBrand" href="/">VEL<span>TRIX</span><small> / STUDIO ADMIN</small></Link><div><button onClick={() => loadAll(token)} className="adminIcon" aria-label="Refresh"><RefreshCw size={16}/></button><button onClick={signOut} className="adminLogout"><LogOut size={15}/> Sign out</button></div></header><div className="adminLayout"><aside className="adminSide"><small>WORKSPACE</small>{(["overview","inquiries","services","bookings","newsletter","projects"] as Tab[]).map(x=><button key={x} className={tab===x ? "selected" : ""} onClick={() => setTab(x)}>{x[0].toUpperCase()+x.slice(1)}</button>)}<Link href="/">← View website</Link></aside><section className="adminContent"><div className="adminPageHead"><div><small>VELTRIX / {tab.toUpperCase()}</small><h1>{tab==="overview"?"Studio overview":tab[0].toUpperCase()+tab.slice(1)}</h1></div>{loading && <span className="adminLoading">Refreshing…</span>}</div>{error && <div className="adminError">{error}</div>}{message && <div className="adminSuccess"><CheckCircle2 size={16}/>{message}</div>}
  {tab==="overview" && <><div className="adminStats">{counts.map(([label,value])=><article key={String(label)}><small>{label}</small><strong>{value}</strong></article>)}</div><div className="adminPanel"><h2>Recent enquiries</h2>{data.inquiries.slice(0,6).map(x=><div className="adminListRow" key={x.id}><div><b>{x.name}</b><small>{x.email} · {x.service_interest || "General enquiry"}</small></div><span className={"status "+x.status}>{x.status}</span></div>)}{!data.inquiries.length && <p className="adminEmpty">No enquiries yet.</p>}</div><div className="adminPanel"><h2>Traffic snapshot</h2><p className="adminSub">{uniqueVisitors} anonymous visitors · {pageViews.length} page views · {data.events.length} total events in the latest 500 loaded.</p>{topPages.map(([path,total])=><div className="adminListRow" key={path}><b>{path}</b><small>{total} page views</small></div>)}{!pageViews.length && <p className="adminEmpty">Traffic data will appear after visitors open the website.</p>}</div></>}
  {tab==="inquiries" && <div className="adminPanel"><h2>Project enquiries</h2>{data.inquiries.map(x=><article className="adminRecord" key={x.id}><div><b>{x.name}</b><small>{x.email} · {x.phone || "No phone"} · {x.company || "No company"}</small><p>{x.message}</p><small>{x.service_interest} · {x.budget}</small></div><select value={x.status ?? "new"} onChange={e=>patch("inquiries",x.id,{status:e.target.value})}><option>new</option><option>contacted</option><option>qualified</option><option>won</option><option>lost</option><option>archived</option></select></article>)}{!data.inquiries.length && <p className="adminEmpty">No enquiries yet.</p>}</div>}
  {tab==="services" && <><form className="adminPanel adminAddForm" onSubmit={addService}><h2>Add a service</h2><input required placeholder="Service name" value={newService.name} onChange={e=>setNewService({...newService,name:e.target.value})}/><input placeholder="Category" value={newService.category} onChange={e=>setNewService({...newService,category:e.target.value})}/><input required type="number" min="0" placeholder="Starting price (EGP)" value={newService.price_egp} onChange={e=>setNewService({...newService,price_egp:e.target.value})}/><input placeholder="Short description" value={newService.description} onChange={e=>setNewService({...newService,description:e.target.value})}/><button className="adminPrimary">Add service</button></form><div className="adminPanel"><h2>Published service catalogue</h2>{data.services.map(x=><div className="adminService" key={x.id}><div><b>{x.name}</b><small>{x.category} · {x.description}</small></div><label>EGP <input type="number" min="0" defaultValue={x.price_egp} onBlur={e=>Number(e.target.value)!==Number(x.price_egp)&&patch("services",x.id,{price_egp:Number(e.target.value)})}/></label><label className="adminToggle"><input type="checkbox" checked={!!x.is_published} onChange={e=>patch("services",x.id,{is_published:e.target.checked})}/> Published</label></div>)}</div></>}
  {tab==="bookings" && <div className="adminPanel"><h2>Consultation requests</h2>{data.bookings.map(x=><article className="adminRecord" key={x.id}><div><b>{x.name}</b><small>{x.email} · {x.phone}</small><p>{x.service_interest} · {x.preferred_date || "Date flexible"} {x.preferred_time}</p><small>{x.notes}</small></div><select value={x.status} onChange={e=>patch("booking_requests",x.id,{status:e.target.value})}><option>pending</option><option>confirmed</option><option>completed</option><option>cancelled</option></select></article>)}{!data.bookings.length && <p className="adminEmpty">No booking requests yet.</p>}</div>}
  {tab==="newsletter" && <div className="adminPanel"><h2>Newsletter subscribers</h2>{data.newsletter.map(x=><div className="adminListRow" key={x.id}><div><b>{x.email}</b><small>{x.name || "No name"} · {new Date(x.created_at ?? "").toLocaleDateString()}</small></div><span className={"status "+x.status}>{x.status}</span></div>)}{!data.newsletter.length && <p className="adminEmpty">No subscribers yet.</p>}</div>}
  {tab==="projects" && <><form className="adminPanel adminAddForm" onSubmit={addProject}><h2>Create a client project</h2><input required placeholder="Client Supabase user UUID" value={project.client_user_id} onChange={e=>setProject({...project,client_user_id:e.target.value})}/><input required placeholder="Project name" value={project.name} onChange={e=>setProject({...project,name:e.target.value})}/><input placeholder="Project summary" value={project.summary} onChange={e=>setProject({...project,summary:e.target.value})}/><label>Target delivery date<input type="date" value={project.due_date} onChange={e=>setProject({...project,due_date:e.target.value})}/></label><button className="adminPrimary">Create project</button></form><form className="adminPanel adminAddForm" onSubmit={addProjectUpdate}><h2>Post a project update</h2><select required value={updateDraft.project_id} onChange={e=>setUpdateDraft({...updateDraft,project_id:e.target.value})}><option value="">Choose a project</option>{data.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input required placeholder="Update title" value={updateDraft.title} onChange={e=>setUpdateDraft({...updateDraft,title:e.target.value})}/><input placeholder="Update details" value={updateDraft.body} onChange={e=>setUpdateDraft({...updateDraft,body:e.target.value})}/><button className="adminPrimary">Publish update to client portal</button></form><div className="adminPanel"><h2>Client projects</h2>{data.projects.map(x=><article className="adminRecord" key={x.id}><div><b>{x.name}</b><small>Client: {x.client_user_id} · Due: {x.due_date || "Not set"}</small><p>{x.summary}</p><small>{x.progress ?? 0}% complete</small><label>Progress % <input type="number" min="0" max="100" defaultValue={x.progress ?? 0} onBlur={e=>Number(e.target.value)!==Number(x.progress ?? 0)&&patch("client_projects",x.id,{progress:Number(e.target.value)})}/></label></div><select value={x.status ?? "planning"} onChange={e=>patch("client_projects",x.id,{status:e.target.value})}><option value="planning">planning</option><option value="in_progress">in progress</option><option value="review">review</option><option value="completed">completed</option><option value="on_hold">on hold</option></select></article>)}{!data.projects.length && <p className="adminEmpty">No client projects created yet.</p>}</div></>}
  </section></div></main>;
}
