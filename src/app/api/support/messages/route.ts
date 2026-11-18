import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
function headers() { return { apikey: SECRET || "", Authorization: `Bearer ${SECRET || ""}`, "Content-Type": "application/json" }; }
async function hydrateAttachments(rows: Record<string, unknown>[]) {
  return Promise.all((rows || []).map(async (row) => {
    const body = typeof row.body === "string" ? row.body : "";
    const match = body.match(/^\[\[VELTRIX_IMAGE:([^|]+)\|([^|]*)\|([^|]*)\]\]\n?/);
    if (!match) return row;
    const path = match[1];
    const signed = await fetch(`${URL}/storage/v1/object/sign/support-attachments/${path.split("/").map(encodeURIComponent).join("/")}`, { method: "POST", headers: headers(), body: JSON.stringify({ expiresIn: 3600 }), cache: "no-store" });
    const result = await signed.json().catch(() => ({}));
    const url = signed.ok ? (result.signedURL?.startsWith("http") ? result.signedURL : URL + "/storage/v1" + result.signedURL) : null;
    return { ...row, body: body.replace(match[0], "").trim(), attachment: { url, name: match[2], mime: match[3] } };
  }));
}

async function admin(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  if (!URL || !PUBLIC_KEY || !auth.startsWith("Bearer ")) return false;
  try {
    const r = await fetch(URL + "/auth/v1/user", { headers: { apikey: PUBLIC_KEY, Authorization: auth }, cache: "no-store" });
    if (!r.ok) return false;
    const user = await r.json();
    return user?.app_metadata?.role === "admin";
  } catch { return false; }
}
export async function GET(request: NextRequest) {
  if (!URL || !SECRET) return NextResponse.json({ error: "Support is not configured." }, { status: 503 });
  const id = request.nextUrl.searchParams.get("id") || "";
  const access = request.nextUrl.searchParams.get("access_token") || "";
  const isAdmin = await admin(request);
  if (!id || (!isAdmin && !access)) return NextResponse.json({ error: "Conversation access is required." }, { status: 401 });
  try {
    if (!isAdmin) {
      const check = await fetch(`${URL}/rest/v1/support_conversations?select=id&id=eq.${encodeURIComponent(id)}&access_token=eq.${encodeURIComponent(access)}&limit=1`, { headers: headers(), cache: "no-store" });
      const rows = await check.json();
      if (!check.ok || !rows?.length) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    const r = await fetch(`${URL}/rest/v1/support_messages?select=*&conversation_id=eq.${encodeURIComponent(id)}&order=created_at.asc&limit=300`, { headers: headers(), cache: "no-store" });
    const messages = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(messages));
    return NextResponse.json({ messages: await hydrateAttachments(messages) });
  } catch (error) {
    console.error("Support messages load failed", error);
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  if (!URL || !SECRET) return NextResponse.json({ error: "Support is not configured." }, { status: 503 });
  try {
    const input = await request.json();
    const id = typeof input.id === "string" ? input.id : "";
    let body = typeof input.body === "string" ? input.body.trim().slice(0, 4000) : "";
    const access = typeof input.access_token === "string" ? input.access_token : "";
    let attachmentPath = "";
    const isAdmin = await admin(request);
    if (!id || (!body && !(input.attachment && typeof input.attachment.data === "string"))) return NextResponse.json({ error: "Write a message or attach an image." }, { status: 400 });
    if (!isAdmin) {
      if (!access) return NextResponse.json({ error: "Conversation access is required." }, { status: 401 });
      const check = await fetch(`${URL}/rest/v1/support_conversations?select=id&id=eq.${encodeURIComponent(id)}&access_token=eq.${encodeURIComponent(access)}&status=neq.closed&limit=1`, { headers: headers(), cache: "no-store" });
      const rows = await check.json();
      if (!check.ok || !rows?.length) return NextResponse.json({ error: "This conversation is unavailable or closed." }, { status: 403 });
    }
    if (input.attachment && typeof input.attachment.data === "string") {
      const file = input.attachment;
      const name = typeof file.name === "string" ? file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0,120) : "image.jpg";
      const mime = typeof file.type === "string" ? file.type : "";
      const base64 = file.data.replace(/^data:[^,]+,/, "");
      const bytes = Buffer.from(base64, "base64");
      const valid = mime === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 || mime === "image/png" && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || mime === "image/webp" && bytes.toString("ascii",0,4)==="RIFF" && bytes.toString("ascii",8,12)==="WEBP";
      if (!valid || bytes.length > 2500 * 1024) return NextResponse.json({ error: "Attach a JPG, PNG or WEBP image up to 2.5 MB after compression." }, { status: 400 });
      attachmentPath = `${id}/${crypto.randomUUID()}-${name}`;
      const upload = await fetch(`${URL}/storage/v1/object/support-attachments/${attachmentPath.split("/").map(encodeURIComponent).join("/")}`, { method:"POST", headers:{apikey:SECRET,Authorization:`Bearer ${SECRET}`,"Content-Type":mime,"x-upsert":"false"}, body:bytes });
      if (!upload.ok) throw new Error("Image upload failed: " + await upload.text());
      body = `[[VELTRIX_IMAGE:${attachmentPath}|${name}|${mime}]]\\n${body}`;
    }
    const sender = isAdmin ? "admin" : "customer";
    const inserted = await fetch(URL + "/rest/v1/support_messages", {
      method: "POST", headers: { ...headers(), Prefer: "return=representation" },
      body: JSON.stringify({ conversation_id: id, sender, body }), cache: "no-store"
    });
    const rows = await inserted.json();
    if (!inserted.ok) throw new Error(JSON.stringify(rows));
    const status = sender === "customer" ? "waiting_admin" : "waiting_customer";
    await fetch(`${URL}/rest/v1/support_conversations?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { ...headers(), Prefer: "return=minimal" },
      body: JSON.stringify({ status, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }), cache: "no-store"
    });
    return NextResponse.json({ message: rows?.[0] || { id, sender, body } });
  } catch (error) {
    console.error("Support message send failed", error);
    return NextResponse.json({ error: "Could not send your message." }, { status: 500 });
  }
}
