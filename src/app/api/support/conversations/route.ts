import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function dbHeaders() {
  return { apikey: SECRET || "", Authorization: `Bearer ${SECRET || ""}`, "Content-Type": "application/json" };
}
async function isAdmin(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  if (!URL || !PUBLIC_KEY || !auth.startsWith("Bearer ")) return false;
  try {
    const r = await fetch(URL + "/auth/v1/user", { headers: { apikey: PUBLIC_KEY, Authorization: auth }, cache: "no-store" });
    if (!r.ok) return false;
    const user = await r.json();
    return user?.app_metadata?.role === "admin";
  } catch { return false; }
}
function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: "Administrator access required." }, { status: 401 });
  if (!URL || !SECRET) return NextResponse.json({ error: "Support inbox is not configured on the server." }, { status: 503 });
  const id = request.nextUrl.searchParams.get("id");
  try {
    if (id) {
      const r = await fetch(`${URL}/rest/v1/support_messages?select=*&conversation_id=eq.${encodeURIComponent(id)}&order=created_at.asc&limit=300`, { headers: dbHeaders(), cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      return NextResponse.json({ messages: await r.json() });
    }
    const r = await fetch(`${URL}/rest/v1/support_conversations?select=*&order=last_message_at.desc&limit=100`, { headers: dbHeaders(), cache: "no-store" });
    if (!r.ok) throw new Error(await r.text());
    return NextResponse.json({ conversations: await r.json() });
  } catch (error) {
    console.error("Support inbox load failed", error);
    return NextResponse.json({ error: "Could not load the support inbox." }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  if (!URL || !SECRET) return NextResponse.json({ error: "Support inbox is not configured on the server." }, { status: 503 });
  try {
    const input = await request.json();
    const name = clean(input.name, 120);
    const email = clean(input.email, 254).toLowerCase();
    const phone = clean(input.phone, 40);
    const context = clean(input.context, 3800);
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter your name and a valid email address." }, { status: 400 });
    const created = await fetch(URL + "/rest/v1/support_conversations", {
      method: "POST", headers: { ...dbHeaders(), Prefer: "return=representation" },
      body: JSON.stringify({ customer_name: name, customer_email: email, customer_phone: phone, status: "waiting_admin" }), cache: "no-store"
    });
    const rows = await created.json();
    if (!created.ok || !rows?.[0]?.id) throw new Error(JSON.stringify(rows));
    const conversation = rows[0];
    if (context) {
      const message = await fetch(URL + "/rest/v1/support_messages", {
        method: "POST", headers: { ...dbHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify({ conversation_id: conversation.id, sender: "system", body: "AI CHAT CONTEXT (for the VELTRIX team):\n" + context }), cache: "no-store"
      });
      if (!message.ok) throw new Error(await message.text());
    }
    return NextResponse.json({ conversation: { id: conversation.id, access_token: conversation.access_token, status: conversation.status } });
  } catch (error) {
    console.error("Support conversation create failed", error);
    return NextResponse.json({ error: "Could not connect you to the VELTRIX team. Please use the contact form." }, { status: 500 });
  }
}
export async function PATCH(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: "Administrator access required." }, { status: 401 });
  if (!URL || !SECRET) return NextResponse.json({ error: "Support inbox is not configured." }, { status: 503 });
  try {
    const input = await request.json();
    const id = clean(input.id, 64);
    const status = clean(input.status, 30);
    if (!id || !["open", "waiting_admin", "waiting_customer", "closed"].includes(status)) return NextResponse.json({ error: "Invalid conversation update." }, { status: 400 });
    const r = await fetch(`${URL}/rest/v1/support_conversations?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { ...dbHeaders(), Prefer: "return=minimal" }, body: JSON.stringify({ status, updated_at: new Date().toISOString() }), cache: "no-store"
    });
    if (!r.ok) throw new Error(await r.text());
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Support status update failed", error);
    return NextResponse.json({ error: "Could not update the conversation." }, { status: 500 });
  }
}
