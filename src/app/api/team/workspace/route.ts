import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
type TeamRole = "admin" | "marketing" | "developer" | "designer";

async function currentUser(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  if (!URL || !PUBLIC_KEY || !SECRET || !auth.startsWith("Bearer ")) return null;
  const response = await fetch(URL + "/auth/v1/user", { headers: { apikey: PUBLIC_KEY, Authorization: auth }, cache: "no-store" });
  if (!response.ok) return null;
  const user = await response.json();
  const role = user?.app_metadata?.role as TeamRole | undefined;
  if (!role || !["admin", "marketing", "developer", "designer"].includes(role)) return null;
  return { user, role };
}
function headers(extra: Record<string, string> = {}) {
  return { apikey: SECRET || "", Authorization: "Bearer " + (SECRET || ""), ...extra };
}
async function read(path: string) {
  const response = await fetch(URL + "/rest/v1/" + path, { headers: headers(), cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error("Workspace data could not be loaded.");
  return result;
}

export async function GET(request: NextRequest) {
  const session = await currentUser(request);
  if (!session) return NextResponse.json({ error: "Team sign-in required." }, { status: 401 });
  try {
    const uid = encodeURIComponent(session.user.id);
    const tasks = await read("team_tasks?select=*&assigned_to=eq." + uid + "&order=due_date.asc.nullslast,created_at.desc&limit=100");
    const announcements = await read("team_announcements?select=*&or=(audience.eq.all,audience.eq." + session.role + ")&order=created_at.desc&limit=30");
    const result: Record<string, unknown> = { role: session.role, profile: { id: session.user.id, email: session.user.email, name: session.user.user_metadata?.full_name || "" }, tasks, announcements };
    if (session.role === "marketing" || session.role === "admin") {
      result.inquiries = await read("inquiries?select=id,name,email,phone,company,service_interest,budget,status,created_at&order=created_at.desc&limit=100");
      result.campaigns = await read("marketing_campaigns?select=*&order=created_at.desc&limit=100");
    }
    if (session.role === "designer" || session.role === "admin") result.assets = await read("design_assets?select=*&order=created_at.desc&limit=100");
    if (session.role === "developer" || session.role === "admin") {
      const projectIds = [...new Set((tasks as Array<Record<string, unknown>>).map(task => String(task.project_id || "")).filter(Boolean))];
      result.projects = projectIds.length ? await read("client_projects?select=id,name,summary,status,progress,due_date,updated_at&id=in.(" + projectIds.map(encodeURIComponent).join(",") + ")&order=updated_at.desc") : [];
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Team workspace load failed", error);
    return NextResponse.json({ error: "Workspace data could not be loaded. Please refresh." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const session = await currentUser(request);
  if (!session) return NextResponse.json({ error: "Team sign-in required." }, { status: 401 });
  try {
    const input = await request.json();
    if (input.kind === "campaign" && session.role === "marketing") {
      const name = String(input.name || "").trim().slice(0, 180);
      const channel = String(input.channel || "Instagram").trim().slice(0, 80);
      const budget = Number(input.budget_egp || 0);
      if (name.length < 2 || !Number.isFinite(budget) || budget < 0) return NextResponse.json({ error: "Enter a campaign name and valid budget." }, { status: 400 });
      const response = await fetch(URL + "/rest/v1/marketing_campaigns", { method: "POST", headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }), body: JSON.stringify({ name, channel, budget_egp: budget, status: "draft", notes: String(input.notes || "").slice(0, 2000), created_by: session.user.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error("Campaign could not be saved.");
      return NextResponse.json({ item: data[0], message: "Campaign created." }, { status: 201 });
    }
    if (input.kind === "asset" && session.role === "designer") {
      const name = String(input.name || "").trim().slice(0, 180);
      if (name.length < 2) return NextResponse.json({ error: "Enter an asset name." }, { status: 400 });
      const response = await fetch(URL + "/rest/v1/design_assets", { method: "POST", headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }), body: JSON.stringify({ name, description: String(input.description || "").slice(0, 2000), file_url: String(input.file_url || "").slice(0, 1000) || null, status: "working", created_by: session.user.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error("Design item could not be saved.");
      return NextResponse.json({ item: data[0], message: "Design item created." }, { status: 201 });
    }
    return NextResponse.json({ error: "This action is not available for your role." }, { status: 403 });
  } catch (error) {
    console.error("Team workspace action failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save this item." }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await currentUser(request);
  if (!session) return NextResponse.json({ error: "Team sign-in required." }, { status: 401 });
  try {
    const input = await request.json();
    const id = String(input.id || "");
    const status = String(input.status || "");
    if (!id || !["todo", "in_progress", "review", "done"].includes(status)) return NextResponse.json({ error: "Invalid task update." }, { status: 400 });
    const response = await fetch(URL + "/rest/v1/team_tasks?id=eq." + encodeURIComponent(id) + "&assigned_to=eq." + encodeURIComponent(session.user.id) + "&department=eq." + session.role, {
      method: "PATCH", headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Task could not be updated." }, { status: 502 });
    if (!data.length) return NextResponse.json({ error: "Task not found or not assigned to your account." }, { status: 404 });
    return NextResponse.json({ task: data[0], message: "Task updated." });
  } catch { return NextResponse.json({ error: "Could not update task." }, { status: 500 }); }
}
