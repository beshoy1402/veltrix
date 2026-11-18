"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, BarChart3, Bot, CheckCircle2, Download, LogOut, RefreshCw, Send, Settings, ShieldCheck, Sparkles, Bell, MessageSquare } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
type Row = { id: string; name?: string; email?: string; phone?: string; company?: string; service_interest?: string; budget?: string; message?: string; preferred_date?: string | null; preferred_time?: string; notes?: string; status?: string; category?: string; description?: string; price_egp?: number | string; is_published?: boolean; sort_order?: number; client_user_id?: string; summary?: string; due_date?: string | null; progress?: number; created_at?: string; path?: string; event_type?: string; session_id?: string; [key: string]: unknown };
type Tab = "overview" | "support" | "payments" | "inquiries" | "services" | "bookings" | "newsletter" | "projects" | "analytics" | "ai" | "settings";
type SupportConversation = { id:string; customer_name:string; customer_email:string; customer_phone?:string; status:string; last_message_at:string; created_at:string };
type SupportMessage = { id:string; conversation_id:string; sender:"customer"|"admin"|"system"; body:string; created_at:string };
type PaymentSubmission = { id:string; reference_code:string; customer_name:string; customer_email:string; customer_phone?:string; project_reference?:string; amount_egp?:number|null; transaction_reference?:string; receipt_url?:string|null; original_filename:string; status:"pending"|"verified"|"rejected"; admin_notes?:string; created_at:string };

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
  const [inviteDraft, setInviteDraft] = useState({ name: "", email: "", project_name: "", summary: "", due_date: "" });
  const [newService, setNewService] = useState({ category: "Business Websites", name: "", description: "", price_egp: "20000" });
  const [updateDraft, setUpdateDraft] = useState({ project_id: "", title: "", body: "" });
  const [aiConfigured, setAiConfigured] = useState(false);
  const [agentKnowledge, setAgentKnowledge] = useState("");
  const [instapayHandle, setInstapayHandle] = useState("");
  const [instapayInstructions, setInstapayInstructions] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>([]);
  const [paymentNotes, setPaymentNotes] = useState<Record<string,string>>({});
  const [paymentBusy, setPaymentBusy] = useState(false);
  const paymentSeen = useRef<Record<string,string>>({});
  const paymentInitialized = useRef(false);
  const [supportConversations, setSupportConversations] = useState<SupportConversation[]>([]);
  const [selectedSupportId, setSelectedSupportId] = useState("");
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportReply, setSupportReply] = useState("");
  const [supportAttachment,setSupportAttachment]=useState<File|null>(null);
  const [supportSearch, setSupportSearch] = useState("");
  const [supportFilter, setSupportFilter] = useState("all");
  const [supportBusy, setSupportBusy] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState("default");
  const supportSeen = useRef<Record<string,string>>({});
  const supportInitialized = useRef(false);

  function pageAdmin(customerName: string) {
    try {
      const Audio = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      const audio = new Audio();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine"; oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, audio.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.45);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + 0.48);
    } catch {}
    if ("Notification" in window && Notification.permission === "granted") new Notification("VELTRIX — Customer needs you", { body: customerName + " is waiting for a reply.", tag: "veltrix-support-" + customerName });
  }

  async function loadPaymentSubmissions(authToken: string) {
    try {
      const response = await fetch("/api/payment-submissions", { headers: { Authorization: `Bearer ${authToken}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load payment proofs.");
      const submissions: PaymentSubmission[] = result.submissions || [];
      const newReceipt = paymentInitialized.current ? submissions.find(item => item.status === "pending" && !paymentSeen.current[item.id]) : undefined;
      if (newReceipt) pageAdmin("New InstaPay receipt from " + newReceipt.customer_name);
      paymentSeen.current = Object.fromEntries(submissions.map(item => [item.id,item.created_at]));
      paymentInitialized.current = true;
      setPaymentSubmissions(submissions);
      setPaymentNotes(Object.fromEntries((result.submissions || []).map((x:PaymentSubmission)=>[x.id,x.admin_notes||""])));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load payment proofs."); }
  }

  async function reviewPayment(item: PaymentSubmission, status: PaymentSubmission["status"]) {
    setPaymentBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/payment-submissions", { method:"PATCH", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body:JSON.stringify({id:item.id,status,admin_notes:paymentNotes[item.id]||""}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update payment.");
      setMessage(`Payment ${item.reference_code} marked as ${status}.`);
      await loadPaymentSubmissions(token);
    } catch(e) { setError(e instanceof Error ? e.message : "Could not update payment."); }
    finally { setPaymentBusy(false); }
  }

  async function loadSupportInbox(authToken: string) {
    try {
      const response = await fetch("/api/support/conversations", { headers: { Authorization: `Bearer ${authToken}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load support inbox.");
      const conversations: SupportConversation[] = result.conversations || [];
      const urgent = conversations.find(item => item.status === "waiting_admin" && item.last_message_at && (!supportSeen.current[item.id] || new Date(item.last_message_at).getTime() > new Date(supportSeen.current[item.id]).getTime()));
      if (urgent) pageAdmin(urgent.customer_name);
      supportSeen.current = Object.fromEntries(conversations.map(item => [item.id, item.last_message_at]));
      supportInitialized.current = true;
      setSupportConversations(conversations);
      if (!selectedSupportId && conversations.length) setSelectedSupportId(conversations[0].id);
    } catch (e) { console.error("Support inbox polling failed", e); }
  }

  async function loadSupportThread(id: string, authToken = token) {
    if (!id || !authToken) return;
    try {
      const response = await fetch("/api/support/conversations?id=" + encodeURIComponent(id), { headers: { Authorization: `Bearer ${authToken}` }, cache: "no-store" });
      const result = await response.json();
      if (response.ok) setSupportMessages(result.messages || []);
    } catch {}
  }

  async function sendSupportReply(event: FormEvent) {
    event.preventDefault();
    const body = supportReply.trim();
    if ((!body && !supportAttachment) || !selectedSupportId || supportBusy) return;
    setSupportBusy(true); setError("");
    try {
      let attachment; if(supportAttachment){const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("Could not read image."));reader.readAsDataURL(supportAttachment);});attachment={name:supportAttachment.name,type:supportAttachment.type,data};} const response = await fetch("/api/support/messages", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: selectedSupportId, body, attachment }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Reply could not be sent.");
      setSupportReply("");
      await loadSupportThread(selectedSupportId);
      await loadSupportInbox(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Reply could not be sent."); }
    finally { setSupportBusy(false); }
  }

  async function sendQuickReply(body: string) {
    if (!selectedSupportId || supportBusy || supportConversations.find(x=>x.id===selectedSupportId)?.status==="closed") return;
    setSupportBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/support/messages", { method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body:JSON.stringify({id:selectedSupportId,body}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Quick reply could not be sent.");
      await loadSupportThread(selectedSupportId);
      await loadSupportInbox(token);
      setMessage("Quick reply sent to the customer.");
    } catch(e) { setError(e instanceof Error ? e.message : "Quick reply could not be sent."); }
    finally { setSupportBusy(false); }
  }

  const quickReplies = [
    {label:"Service options",icon:"✦",body:"Here are the main types of projects we can help with:\n• Business / company website\n• E-commerce store\n• Landing page\n• Web application or dashboard\n• Website redesign\n• Ongoing maintenance\n\nWhich option best matches what you need?"},
    {label:"Website options",icon:"▤",body:"What kind of website are you looking for?\n1. Business / company website\n2. E-commerce store\n3. Landing page\n4. Portfolio website\n5. Web application / dashboard\n6. Redesign of an existing website\n\nReply with a number or tell me about your idea."},
    {label:"Project details",icon:"⌕",body:"To understand your project, could you share:\n• What your business does\n• The main goal of the website\n• The pages or features you need\n• Any reference websites or design style you like\n\nYou can send whatever details you already have."},
    {label:"Budget",icon:"＄",body:"Do you have an approximate budget range in mind for this project? This will help us recommend a suitable scope. We’ll confirm the final quotation after reviewing your requirements."},
    {label:"Timeline",icon:"◷",body:"When would you ideally like the project to launch? The delivery timeline depends on the project scope and required features, so I can confirm a realistic schedule after we understand the details."},
    {label:"Our process",icon:"↗",body:"Our usual process is:\n1. Understand your goals and requirements\n2. Agree on the scope and quotation\n3. Design the experience\n4. Develop and review the website\n5. Final checks and launch\n\nWe’ll keep you updated as the project progresses."},
    {label:"Book a call",icon:"◉",body:"Would you like to arrange a consultation with our team? Please share the day and time that suit you, along with your time zone, and we’ll follow up to confirm."},
    {label:"Payment info",icon:"▣",body:"We’ll share the confirmed payment instructions and invoice details once the project scope and quotation are agreed. Please only transfer to payment details provided through our official VELTRIX communication."},
    {label:"Need more info",icon:"?",body:"Absolutely. What would you like to know more about? You can ask about our services, project process, pricing, delivery timeline, or anything specific to your idea."},
  ];

  async function updateSupportStatus(status: string) {
    if (!selectedSupportId) return;
    try {
      const response = await fetch("/api/support/conversations", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: selectedSupportId, status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update conversation.");
      await loadSupportInbox(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update conversation."); }
  }

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
    await loadSupportInbox(authToken);
    try { const rows = await api("site_settings?select=value&key=eq.agent_knowledge_base", authToken); setAgentKnowledge(rows?.[0]?.value?.content ?? ""); } catch { setAgentKnowledge(""); }
    try { const rows = await api("site_settings?select=value&key=eq.instapay_payment_details", authToken); setInstapayHandle(rows?.[0]?.value?.handle ?? ""); setInstapayInstructions(rows?.[0]?.value?.instructions ?? ""); } catch { setInstapayHandle(""); setInstapayInstructions(""); }
    try { const status = await fetch("/api/admin/ai", { headers: { Authorization: `Bearer ${authToken}` } }); if (status.ok) { const result = await status.json(); setAiConfigured(Boolean(result.configured)); } } catch { setAiConfigured(false); }
  }

  useEffect(() => {
    if ("Notification" in window) setNotificationPermission(Notification.permission);
    const saved = sessionStorage.getItem("veltrix-admin-token");
    if (saved) verify(saved).catch(() => { sessionStorage.removeItem("veltrix-admin-token"); setToken(""); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return;
    void loadPaymentSubmissions(token);
    const timer = window.setInterval(() => { void loadSupportInbox(token); if (tab === "payments") void loadPaymentSubmissions(token); }, 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab]);

  useEffect(() => {
    if (!token || !selectedSupportId || tab !== "support") return;
    void loadSupportThread(selectedSupportId, token);
    const timer = window.setInterval(() => { void loadSupportThread(selectedSupportId, token); }, 3500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedSupportId, tab]);

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

  async function inviteClient(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      const response = await fetch("/api/admin/invite-client", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(inviteDraft),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not invite client.");
      setInviteDraft({ name: "", email: "", project_name: "", summary: "", due_date: "" });
      setMessage(result.message || "Invitation sent and project created.");
      await loadAll(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not invite client."); }
    finally { setLoading(false); }
  }

  async function addProject(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      await api("client_projects", token, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ ...project, due_date: project.due_date || null, status: "planning", progress: 0 }) });
      setProject({ client_user_id: "", name: "", summary: "", due_date: "" }); setMessage("Client project created."); await loadAll(token);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create project."); }
  }

  async function saveAgentKnowledge(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try { await api("site_settings?on_conflict=key", token, { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key: "agent_knowledge_base", value: { content: agentKnowledge } }) }); setMessage("VELTRIX agent knowledge saved. New conversations will use the updated information."); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save agent knowledge."); }
  }

  async function saveInstapaySettings(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    try {
      await api("site_settings?on_conflict=key", token, { method:"POST", headers:{Prefer:"resolution=merge-duplicates,return=minimal"}, body:JSON.stringify({key:"instapay_payment_details",value:{handle:instapayHandle.trim(),instructions:instapayInstructions.trim()}}) });
      setMessage("InstaPay payment details saved. The public payment page will show the updated details.");
    } catch(e) { setError(e instanceof Error ? e.message : "Could not save InstaPay settings."); }
  }

  async function askAI(prompt?: string) {
    const text = (prompt ?? aiInput).trim();
    if (!text || aiBusy || !aiConfigured) return;
    const next = [...aiMessages, { role: "user" as const, content: text }];
    setAiMessages(next); setAiInput(""); setAiBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI request failed.");
      setAiMessages([...next, { role: "assistant", content: result.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the AI assistant.");
    } finally { setAiBusy(false); }
  }

  function exportCsv(label: string, rows: Row[]) {
    if (!rows.length) { setMessage("There is no data to export yet."); return; }
    const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
    const cell = (value: unknown) => {
      const raw = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
      return `"${raw.replace(/"/g, '""')}"`;
    };
    const csv = [columns.map(cell).join(","), ...rows.map(row => columns.map(key => cell(row[key])).join(","))].join("\\r\\n");
    const url = URL.createObjectURL(new Blob(["\\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `veltrix-${label}-${new Date().toISOString().slice(0,10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  const pageViews = data.events.filter(x => x.event_type === "page_view");
  const uniqueVisitors = new Set(pageViews.map(x => x.session_id).filter(Boolean)).size;
  const topPages = Object.entries(pageViews.reduce((acc: Record<string, number>, x) => { const path = x.path || "/"; acc[path] = (acc[path] || 0) + 1; return acc; }, {})).sort((a,b) => b[1]-a[1]).slice(0,5);
  const pendingSupport = supportConversations.filter(x => x.status === "waiting_admin" || x.status === "open").length;
  const visibleSupportConversations = supportConversations.filter(item => {
    const query = supportSearch.trim().toLowerCase();
    const matchesSearch = !query || [item.customer_name, item.customer_email, item.customer_phone ?? ""].some(value => value.toLowerCase().includes(query));
    const matchesFilter = supportFilter === "all" || (supportFilter === "needs_reply" ? item.status === "waiting_admin" || item.status === "open" : item.status === supportFilter);
    return matchesSearch && matchesFilter;
  });
  const counts = [
    ["New enquiries", data.inquiries.filter(x => x.status === "new").length],
    ["Customer support waiting", pendingSupport],
    ["Pending bookings", data.bookings.filter(x => x.status === "pending").length],
    ["Active projects", data.projects.filter(x => !["completed", "on_hold"].includes(x.status ?? "")).length],
    ["Subscribers", data.newsletter.filter(x => x.status === "active").length],
    ["Page views", pageViews.length],
  ];

  if (!token) return <main className="adminShell"><Link className="adminBack" href="/"><ArrowLeft size={16}/> Back to VELTRIX</Link><form className="adminLogin" onSubmit={signIn}><div className="adminMark"><ShieldCheck size={25}/></div><small>VELTRIX / PRIVATE AREA</small><h1>Studio administration.</h1><p>Sign in with your Supabase administrator account.</p><label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="username"/></label><label>Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"/></label>{error && <div className="adminError">{error}</div>}<button className="adminPrimary" disabled={loading}>{loading ? "Signing in..." : "Sign in securely"}</button><small className="adminHint">Access is controlled by the administrator role in Supabase app metadata.</small></form></main>;

  return <main className="adminShell"><header className="adminTop"><Link className="adminBrand" href="/">VEL<span>TRIX</span><small> / STUDIO ADMIN</small></Link><div><button onClick={() => loadAll(token)} className="adminIcon" aria-label="Refresh"><RefreshCw size={16}/></button><button onClick={signOut} className="adminLogout"><LogOut size={15}/> Sign out</button></div></header><div className="adminLayout"><aside className="adminSide"><small>WORKSPACE</small>{(["overview","support","payments","inquiries","services","bookings","newsletter","projects","analytics","ai","settings"] as Tab[]).map(x=><button key={x} className={tab===x ? "selected" : ""} onClick={() => setTab(x)}>{x==="support"?"Support inbox":x==="payments"?"Payment proofs":x==="ai"?"AI Studio":x==="settings"?"Settings":x[0].toUpperCase()+x.slice(1)}{x==="support"&&pendingSupport>0?<i className="adminSupportBadge">{pendingSupport}</i>:x==="payments"&&paymentSubmissions.filter(p=>p.status==="pending").length>0?<i className="adminSupportBadge">{paymentSubmissions.filter(p=>p.status==="pending").length}</i>:null}</button>)}<Link href="/">← View website</Link></aside><section className="adminContent"><div className="adminPageHead"><div><small>VELTRIX / {tab.toUpperCase()}</small><h1>{tab==="overview"?"Studio overview":tab==="support"?"Customer support":tab==="payments"?"InstaPay payment proofs":tab[0].toUpperCase()+tab.slice(1)}</h1></div>{loading && <span className="adminLoading">Refreshing…</span>}</div>{error && <div className="adminError">{error}</div>}{message && <div className="adminSuccess"><CheckCircle2 size={16}/>{message}</div>}
  {tab==="overview" && <><div className="adminStats">{counts.map(([label,value])=><article key={String(label)}><small>{label}</small><strong>{value}</strong></article>)}</div><div className="adminPanel"><h2>Recent enquiries</h2>{data.inquiries.slice(0,6).map(x=><div className="adminListRow" key={x.id}><div><b>{x.name}</b><small>{x.email} · {x.service_interest || "General enquiry"}</small></div><span className={"status "+x.status}>{x.status}</span></div>)}{!data.inquiries.length && <p className="adminEmpty">No enquiries yet.</p>}</div><div className="adminPanel"><h2>Traffic snapshot</h2><p className="adminSub">{uniqueVisitors} anonymous visitors · {pageViews.length} page views · {data.events.length} total events in the latest 500 loaded.</p>{topPages.map(([path,total])=><div className="adminListRow" key={path}><b>{path}</b><small>{total} page views</small></div>)}{!pageViews.length && <p className="adminEmpty">Traffic data will appear after visitors open the website.</p>}</div></>}
  {tab==="payments" && <div className="adminPaymentList"><div className="adminPanelHead"><div><h2>InstaPay receipts</h2><p className="adminSub">Private uploads from customers. Verify the transfer in your bank or InstaPay account before approving.</p></div><button className="adminExport" onClick={()=>void loadPaymentSubmissions(token)}><RefreshCw size={14}/> Refresh</button></div>{paymentSubmissions.map(item=><article className="adminPanel adminPaymentCard" key={item.id}><div className="adminPaymentTop"><div><small className="adminPaymentRef">{item.reference_code}</small><h3>{item.customer_name}</h3><p>{item.customer_email}{item.customer_phone?" · "+item.customer_phone:""}</p></div><i className={"status "+item.status}>{item.status}</i></div><div className="adminPaymentMeta"><span><small>PROJECT / INVOICE</small><b>{item.project_reference||"Not provided"}</b></span><span><small>AMOUNT SENT</small><b>{item.amount_egp?Number(item.amount_egp).toLocaleString()+" EGP":"Not provided"}</b></span><span><small>TRANSACTION REF</small><b>{item.transaction_reference||"Not provided"}</b></span><span><small>SUBMITTED</small><b>{new Date(item.created_at).toLocaleString()}</b></span></div>{item.receipt_url?<a className="adminPaymentPreview" href={item.receipt_url} target="_blank" rel="noreferrer"><img src={item.receipt_url} alt={"InstaPay receipt "+item.reference_code}/><span>Open full receipt ↗</span></a>:<p className="adminEmpty">Receipt preview unavailable. Refresh to generate a new secure link.</p>}<label className="adminPaymentNotes">Internal admin notes<textarea rows={2} value={paymentNotes[item.id]||""} onChange={e=>setPaymentNotes({...paymentNotes,[item.id]:e.target.value})} placeholder="Optional review notes"/></label><div className="adminPaymentActions"><button disabled={paymentBusy} onClick={()=>void reviewPayment(item,"pending")}>Keep pending</button><button disabled={paymentBusy} onClick={()=>void reviewPayment(item,"rejected")}>Reject</button><button disabled={paymentBusy} className="adminPrimary" onClick={()=>void reviewPayment(item,"verified")}>Mark verified</button></div></article>)}{!paymentSubmissions.length&&<div className="adminPanel"><p className="adminEmpty">No payment screenshots submitted yet. Share the separate payment page link with your customers: /payment</p></div>}</div>}
  {tab==="support" && <div className="adminSupportWorkspace">
    <div className="adminSupportToolbar">
      <div><small className="adminEyebrow">CUSTOMER CARE / LIVE INBOX</small><h2>Support conversations</h2><p>Find a customer, review their messages and reply without leaving the dashboard.</p></div>
      <button className="adminExport" onClick={()=>void loadSupportInbox(token)}><RefreshCw size={14}/> Refresh inbox</button>
    </div>
    <div className="adminSupportStats">
      <div><b>{supportConversations.length}</b><span>All conversations</span></div>
      <div><b>{pendingSupport}</b><span>Needs attention</span></div>
      <div><b>{supportConversations.filter(x=>x.status==="waiting_customer").length}</b><span>Waiting for customer</span></div>
      <div><b>{supportConversations.filter(x=>x.status==="closed").length}</b><span>Closed</span></div>
    </div>
    <div className="adminSupportLayout">
      <div className="adminPanel adminSupportList">
        <div className="adminPanelHead"><div><h2>Inbox</h2><p className="adminSub">New messages are checked every 5 seconds while this dashboard is open.</p></div><button className="adminExport" onClick={async()=>{if("Notification" in window){const permission=await Notification.requestPermission();setNotificationPermission(permission);setMessage(permission==="granted"?"Browser notifications enabled.":"Browser notifications were not enabled.");}}}><Bell size={14}/> {notificationPermission==="granted"?"Alerts on":"Enable alerts"}</button></div>
        <input className="adminSupportSearch" value={supportSearch} onChange={e=>setSupportSearch(e.target.value)} placeholder="Search name, email or phone…" aria-label="Search customer conversations"/>
        <div className="adminSupportFilters"><button className={supportFilter==="all"?"active":""} onClick={()=>setSupportFilter("all")}>All</button><button className={supportFilter==="needs_reply"?"active":""} onClick={()=>setSupportFilter("needs_reply")}>Needs reply</button><button className={supportFilter==="waiting_customer"?"active":""} onClick={()=>setSupportFilter("waiting_customer")}>Waiting</button><button className={supportFilter==="closed"?"active":""} onClick={()=>setSupportFilter("closed")}>Closed</button></div>
        <div className="adminSupportConversationList">{visibleSupportConversations.map(item=><button key={item.id} className={"adminSupportConversation "+(selectedSupportId===item.id?"active":"")} onClick={()=>setSelectedSupportId(item.id)}><span className="adminSupportAvatar">{item.customer_name.slice(0,1).toUpperCase()}</span><span><b>{item.customer_name}</b><small>{item.customer_email}</small><small>{new Date(item.last_message_at).toLocaleString()}</small></span><i className={"status "+item.status}>{item.status==="waiting_admin"?"Needs reply":item.status==="waiting_customer"?"Waiting":item.status}</i></button>)}
        {!visibleSupportConversations.length&&<div className="adminSupportEmpty"><MessageSquare size={22}/><b>{supportConversations.length?"No matching conversations":"Your inbox is clear"}</b><span>{supportConversations.length?"Try another search or filter.":"Customer requests for a real person will appear here."}</span></div>}
      </div>
      <div className="adminPanel adminSupportThread">
        {selectedSupportId ? <>
          <div className="adminSupportCustomerBar"><div><small className="adminEyebrow">CUSTOMER CONVERSATION</small><h2>{supportConversations.find(x=>x.id===selectedSupportId)?.customer_name||"Customer"}</h2><p>{supportConversations.find(x=>x.id===selectedSupportId)?.customer_email}{supportConversations.find(x=>x.id===selectedSupportId)?.customer_phone?" · "+supportConversations.find(x=>x.id===selectedSupportId)?.customer_phone:""}</p></div><select aria-label="Conversation status" value={supportConversations.find(x=>x.id===selectedSupportId)?.status||"open"} onChange={e=>void updateSupportStatus(e.target.value)}><option value="open">Open</option><option value="waiting_admin">Needs reply</option><option value="waiting_customer">Waiting for customer</option><option value="closed">Closed</option></select></div>
          <div className="adminSupportMessages">{supportMessages.map(item=><article key={item.id} className={"adminSupportMessage "+item.sender}><small>{item.sender==="admin"?"YOU":item.sender==="customer"?"CUSTOMER":"CONTEXT"}</small><p>{item.body}</p>{item.attachment?.url&&<a className="adminSupportImage" href={item.attachment.url} target="_blank" rel="noreferrer"><img src={item.attachment.url} alt={item.attachment.name}/><span>Open image ↗</span></a>}<time>{new Date(item.created_at).toLocaleString()}</time></article>)}{!supportMessages.length&&<p className="adminEmpty">No messages in this conversation yet.</p>}</div>
          <section className="adminQuickReplies"><div className="adminQuickRepliesHead"><div><b>Quick replies</b><small>Choose a response to send it instantly</small></div><span>ONE-CLICK</span></div><div className="adminQuickReplyGrid">{quickReplies.map(item=><button type="button" key={item.label} disabled={supportBusy||supportConversations.find(x=>x.id===selectedSupportId)?.status==="closed"} onClick={()=>void sendQuickReply(item.body)}><span>{item.icon}</span>{item.label}</button>)}</div></section>
          <form className="adminSupportReply" onSubmit={sendSupportReply}><textarea value={supportReply} onChange={e=>setSupportReply(e.target.value)} placeholder="Type your message here…" rows={3} disabled={supportBusy||supportConversations.find(x=>x.id===selectedSupportId)?.status==="closed"}/><div className="adminSupportComposerActions"><label className="adminSupportAttach"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setSupportAttachment(e.target.files?.[0]||null)}/><span>＋ Attach image</span></label>{supportAttachment&&<small>{supportAttachment.name} <button type="button" onClick={()=>setSupportAttachment(null)}>Remove</button></small>}<button className="adminPrimary" disabled={(!supportReply.trim()&&!supportAttachment)||supportBusy||supportConversations.find(x=>x.id===selectedSupportId)?.status==="closed"}><Send size={15}/>{supportBusy?"Sending…":"Send message"}</button></div></form>
          <p className="adminSub">Replies appear in the customer’s website chat. Email and WhatsApp are not sent.</p>
        </> : <div className="adminSupportEmpty adminSupportThreadEmpty"><MessageSquare size={28}/><b>Choose a conversation</b><span>Select a customer from the inbox to read and reply to their messages.</span></div>}
      </div>
    </div>
  </div>}
  {tab==="inquiries" && <div className="adminPanel"><h2>Project enquiries</h2>{data.inquiries.map(x=><article className="adminRecord" key={x.id}><div><b>{x.name}</b><small>{x.email} · {x.phone || "No phone"} · {x.company || "No company"}</small><p>{x.message}</p><small>{x.service_interest} · {x.budget}</small></div><select value={x.status ?? "new"} onChange={e=>patch("inquiries",x.id,{status:e.target.value})}><option>new</option><option>contacted</option><option>qualified</option><option>won</option><option>lost</option><option>archived</option></select></article>)}{!data.inquiries.length && <p className="adminEmpty">No enquiries yet.</p>}</div>}
  {tab==="services" && <><form className="adminPanel adminAddForm" onSubmit={addService}><h2>Add a service</h2><input required placeholder="Service name" value={newService.name} onChange={e=>setNewService({...newService,name:e.target.value})}/><input placeholder="Category" value={newService.category} onChange={e=>setNewService({...newService,category:e.target.value})}/><input required type="number" min="0" placeholder="Starting price (EGP)" value={newService.price_egp} onChange={e=>setNewService({...newService,price_egp:e.target.value})}/><input placeholder="Short description" value={newService.description} onChange={e=>setNewService({...newService,description:e.target.value})}/><button className="adminPrimary">Add service</button></form><div className="adminPanel"><h2>Published service catalogue</h2>{data.services.map(x=><div className="adminService" key={x.id}><div><b>{x.name}</b><small>{x.category} · {x.description}</small></div><label>EGP <input type="number" min="0" defaultValue={x.price_egp} onBlur={e=>Number(e.target.value)!==Number(x.price_egp)&&patch("services",x.id,{price_egp:Number(e.target.value)})}/></label><label className="adminToggle"><input type="checkbox" checked={!!x.is_published} onChange={e=>patch("services",x.id,{is_published:e.target.checked})}/> Published</label></div>)}</div></>}
  {tab==="bookings" && <div className="adminPanel"><h2>Consultation requests</h2>{data.bookings.map(x=><article className="adminRecord" key={x.id}><div><b>{x.name}</b><small>{x.email} · {x.phone}</small><p>{x.service_interest} · {x.preferred_date || "Date flexible"} {x.preferred_time}</p><small>{x.notes}</small></div><select value={x.status} onChange={e=>patch("booking_requests",x.id,{status:e.target.value})}><option>pending</option><option>confirmed</option><option>completed</option><option>cancelled</option></select></article>)}{!data.bookings.length && <p className="adminEmpty">No booking requests yet.</p>}</div>}
  {tab==="newsletter" && <div className="adminPanel"><h2>Newsletter subscribers</h2>{data.newsletter.map(x=><div className="adminListRow" key={x.id}><div><b>{x.email}</b><small>{x.name || "No name"} · {new Date(x.created_at ?? "").toLocaleDateString()}</small></div><span className={"status "+x.status}>{x.status}</span></div>)}{!data.newsletter.length && <p className="adminEmpty">No subscribers yet.</p>}</div>}
  {tab==="projects" && <><form className="adminPanel adminAddForm" onSubmit={inviteClient}><h2>Invite a new client</h2><p className="adminSub">Create their account, send a secure email invitation, and link their first project automatically.</p><input required placeholder="Client full name" value={inviteDraft.name} onChange={e=>setInviteDraft({...inviteDraft,name:e.target.value})}/><input required type="email" placeholder="Client email address" value={inviteDraft.email} onChange={e=>setInviteDraft({...inviteDraft,email:e.target.value})}/><input required placeholder="Project name" value={inviteDraft.project_name} onChange={e=>setInviteDraft({...inviteDraft,project_name:e.target.value})}/><input placeholder="Project summary" value={inviteDraft.summary} onChange={e=>setInviteDraft({...inviteDraft,summary:e.target.value})}/><label>Target delivery date<input type="date" value={inviteDraft.due_date} onChange={e=>setInviteDraft({...inviteDraft,due_date:e.target.value})}/></label><button className="adminPrimary" disabled={loading}>{loading ? "Sending invitation..." : "Invite client & create project"}</button></form><form className="adminPanel adminAddForm" onSubmit={addProject}><h2>Link a project to an existing account</h2><input required placeholder="Client Supabase user UUID" value={project.client_user_id} onChange={e=>setProject({...project,client_user_id:e.target.value})}/><input required placeholder="Project name" value={project.name} onChange={e=>setProject({...project,name:e.target.value})}/><input placeholder="Project summary" value={project.summary} onChange={e=>setProject({...project,summary:e.target.value})}/><label>Target delivery date<input type="date" value={project.due_date} onChange={e=>setProject({...project,due_date:e.target.value})}/></label><button className="adminPrimary">Create project</button></form><form className="adminPanel adminAddForm" onSubmit={addProjectUpdate}><h2>Post a project update</h2><select required value={updateDraft.project_id} onChange={e=>setUpdateDraft({...updateDraft,project_id:e.target.value})}><option value="">Choose a project</option>{data.projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input required placeholder="Update title" value={updateDraft.title} onChange={e=>setUpdateDraft({...updateDraft,title:e.target.value})}/><input placeholder="Update details" value={updateDraft.body} onChange={e=>setUpdateDraft({...updateDraft,body:e.target.value})}/><button className="adminPrimary">Publish update to client portal</button></form><div className="adminPanel"><h2>Client projects</h2>{data.projects.map(x=><article className="adminRecord" key={x.id}><div><b>{x.name}</b><small>Client: {x.client_user_id} · Due: {x.due_date || "Not set"}</small><p>{x.summary}</p><small>{x.progress ?? 0}% complete</small><label>Progress % <input type="number" min="0" max="100" defaultValue={x.progress ?? 0} onBlur={e=>Number(e.target.value)!==Number(x.progress ?? 0)&&patch("client_projects",x.id,{progress:Number(e.target.value)})}/></label></div><select value={x.status ?? "planning"} onChange={e=>patch("client_projects",x.id,{status:e.target.value})}><option value="planning">planning</option><option value="in_progress">in progress</option><option value="review">review</option><option value="completed">completed</option><option value="on_hold">on hold</option></select></article>)}{!data.projects.length && <p className="adminEmpty">No client projects created yet.</p>}</div></>}
  {tab==="analytics" && <><div className="adminStats"><article><small>UNIQUE VISITORS</small><strong>{uniqueVisitors}</strong></article><article><small>PAGE VIEWS</small><strong>{pageViews.length}</strong></article><article><small>QUOTE OPENS</small><strong>{data.events.filter(x=>x.event_type==="quote_open").length}</strong></article><article><small>INQUIRY EVENTS</small><strong>{data.events.filter(x=>x.event_type==="inquiry_submit").length}</strong></article><article><small>CONVERSION SIGNALS</small><strong>{data.inquiries.length}</strong></article></div><div className="adminPanel"><div className="adminPanelHead"><h2>Traffic by page</h2><button className="adminExport" onClick={()=>exportCsv("analytics",data.events)}><Download size={14}/> Export events</button></div>{topPages.map(([path,total])=><div className="adminMetricRow" key={path}><span>{path}</span><div><i style={{width:`${Math.max(4,total/Math.max(1,topPages[0]?.[1]||1)*100)}%`}}/></div><b>{total}</b></div>)}{!pageViews.length&&<p className="adminEmpty">Traffic analytics will appear as visitors use the website.</p>}</div><div className="adminPanel"><h2>Export your data</h2><p className="adminSub">Download the records currently loaded in this dashboard as CSV files for spreadsheets and reporting.</p><div className="adminExportGrid"><button className="adminExport" onClick={()=>exportCsv("enquiries",data.inquiries)}><Download size={14}/> Enquiries</button><button className="adminExport" onClick={()=>exportCsv("bookings",data.bookings)}><Download size={14}/> Bookings</button><button className="adminExport" onClick={()=>exportCsv("subscribers",data.newsletter)}><Download size={14}/> Subscribers</button><button className="adminExport" onClick={()=>exportCsv("projects",data.projects)}><Download size={14}/> Projects</button></div></div></>}
  {tab==="ai" && <div className="adminAI"><div className="adminAIIntro"><span><Sparkles size={17}/> VELTRIX / INTELLIGENCE</span><h2>Your studio copilot.</h2><p>Draft client replies, shape proposals, write service copy, plan campaigns and think through project decisions.</p><div className={aiConfigured?"adminAIStatus":"adminAIStatus offline"}><i/>{aiConfigured?"Gemini connection configured":"Gemini API key required"}</div></div><div className="adminAIChat"><div className="adminAIQuick"><small>START WITH A TASK</small>{["Write a polished reply to a new website enquiry.","Create a premium proposal outline for an e-commerce project.","Write a short Instagram campaign for VELTRIX.","Help me qualify a potential client and prepare discovery questions."] .map(prompt=><button key={prompt} disabled={!aiConfigured||aiBusy} onClick={()=>askAI(prompt)}>{prompt}<span>↗</span></button>)}</div><div className="adminAIConversation">{aiMessages.length===0?<div className="adminAIEmpty"><Bot size={26}/><b>What are we working on?</b><span>Ask your VELTRIX assistant anything about copy, proposals or studio operations.</span></div>:aiMessages.map((item,index)=><article key={index} className={item.role==="user"?"fromUser":"fromAI"}><small>{item.role==="user"?"YOU":"VELTRIX AI"}</small><p>{item.content}</p></article>)}{aiBusy&&<div className="adminAIThinking">Thinking…</div>}</div><form className="adminAIComposer" onSubmit={e=>{e.preventDefault();void askAI();}}><textarea value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder={aiConfigured?"Ask your studio assistant…":"Add GEMINI_API_KEY in Vercel to enable AI"} disabled={!aiConfigured||aiBusy} rows={3}/><button className="adminPrimary" disabled={!aiConfigured||aiBusy||!aiInput.trim()}><Send size={15}/>{aiBusy?"Working…":"Send"}</button></form><p className="adminAIPrivacy">Private admin feature. Your API key stays on the server. Do not paste passwords, API keys, payment details or unnecessary personal information.</p></div></div>}
  {tab==="settings" && <><form className="adminPanel adminAddForm" onSubmit={saveInstapaySettings}><h2>InstaPay payment settings</h2><p className="adminSub">Enter the official InstaPay ID or recipient details customers should see on the standalone payment page. Leave blank until you are ready. Never add PINs, passwords or OTPs.</p><label>Official InstaPay ID / account details<input value={instapayHandle} onChange={e=>setInstapayHandle(e.target.value)} maxLength={180} placeholder="Enter your official InstaPay ID"/></label><label>Payment instructions<textarea rows={4} value={instapayInstructions} onChange={e=>setInstapayInstructions(e.target.value)} maxLength={1000} placeholder="Optional instructions, such as the recipient name or what to include in the transfer note."/></label><button className="adminPrimary">Save InstaPay details</button></form><form className="adminPanel adminAddForm" onSubmit={saveAgentKnowledge}><h2>Agent knowledge base</h2><p className="adminSub">Add verified business information, FAQs, policies, service details and support instructions. The public VELTRIX Agent reads this content when answering visitors. Keep secrets and personal data out of this field.</p><textarea rows={12} value={agentKnowledge} onChange={e=>setAgentKnowledge(e.target.value)} placeholder={"Example:\nBusiness hours: Sunday–Thursday, 10:00–18:00 Egypt time.\nSupport policy: ...\nRevision policy: ...\nPayment methods: ..."} /><button className="adminPrimary">Save agent knowledge</button></form><div className="adminPanel"><div className="adminPanelHead"><h2>AI connection</h2><span className={aiConfigured?"adminAIStatus":"adminAIStatus offline"}><i/>{aiConfigured?"Connected":"Not configured"}</span></div><p className="adminSub">Connect the free-tier Google Gemini API to use the AI Studio assistant. The secret is stored as a Vercel environment variable and is never sent to the browser.</p><ol className="adminSetupSteps"><li>Create a free API key in <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.</li><li>In Vercel, open Project → Settings → Environment Variables.</li><li>Add <code>GEMINI_API_KEY</code> with your secret value for Production (and Preview if needed).</li><li>Save the variable and redeploy the latest production deployment.</li><li>Return here and refresh the dashboard. The AI Studio tab will become available.</li></ol><button className="adminExport" onClick={async()=>{const response=await fetch("/api/admin/ai",{headers:{Authorization:`Bearer ${token}`}});if(response.ok){const status=await response.json();setAiConfigured(Boolean(status.configured));setMessage(status.configured?"Gemini connection is configured.":"Gemini API key is still missing.");}else setError("Could not check AI connection.");}}><RefreshCw size={14}/> Check connection</button></div><div className="adminPanel"><h2>Workspace</h2><p className="adminSub">Signed in with administrator permissions. The admin dashboard uses the existing Supabase project and role-based access controls.</p><div className="adminListRow"><b>Website</b><small>veltrix-lac.vercel.app</small></div><div className="adminListRow"><b>Database</b><small>Supabase · connected through existing dashboard session</small></div><div className="adminListRow"><b>AI provider</b><small>Google Gemini API · server-side only</small></div></div></>}
  </section></div></main>;
}
