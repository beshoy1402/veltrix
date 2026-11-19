import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const ROLES = new Set(["marketing", "developer", "designer"]);

async function requireAdmin(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  if (!URL || !PUBLIC_KEY || !SECRET || !auth.startsWith("Bearer ")) return null;
  const response = await fetch(URL + "/auth/v1/user", { headers: { apikey: PUBLIC_KEY, Authorization: auth }, cache: "no-store" });
  if (!response.ok) return null;
  const user = await response.json();
  return user?.app_metadata?.role === "admin" ? user : null;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  try {
    const response = await fetch(URL + "/auth/v1/admin/users?page=1&per_page=200", { headers: { apikey: SECRET!, Authorization: "Bearer " + SECRET! }, cache: "no-store" });
    const result = await response.json();
    if (!response.ok) return NextResponse.json({ error: result.message || "Could not load team accounts." }, { status: 502 });
    const members = (result.users || []).filter((user: Record<string, unknown>) => ROLES.has(String((user.app_metadata as Record<string, unknown> | undefined)?.role || ""))).map((user: Record<string, unknown>) => ({
      id: user.id, email: user.email, name: (user.user_metadata as Record<string, unknown> | undefined)?.full_name || "",
      role: (user.app_metadata as Record<string, unknown> | undefined)?.role || "",
      created_at: user.created_at, last_sign_in_at: user.last_sign_in_at, banned_until: user.banned_until || null,
    }));
    return NextResponse.json({ members });
  } catch { return NextResponse.json({ error: "Could not load team accounts." }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  try {
    const input = await request.json();
    const name = String(input.name || "").trim().slice(0, 120);
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");
    const role = String(input.role || "");
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || !ROLES.has(role)) {
      return NextResponse.json({ error: "Enter a name, valid email, password of at least 12 characters, and a valid team role." }, { status: 400 });
    }
    const response = await fetch(URL + "/auth/v1/admin/users", {
      method: "POST", headers: { apikey: SECRET!, Authorization: "Bearer " + SECRET!, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: name, account_type: "team" }, app_metadata: { role } }), cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) return NextResponse.json({ error: result.msg || result.message || "Team account could not be created." }, { status: response.status });
    return NextResponse.json({ member: { id: result.id, email: result.email, name, role }, message: "Team account created. Share the temporary password securely." }, { status: 201 });
  } catch { return NextResponse.json({ error: "Could not create the team account." }, { status: 500 }); }
}
