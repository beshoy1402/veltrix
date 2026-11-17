import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorization = request.headers.get("authorization");

  if (!url || !publicKey || !secretKey) {
    return NextResponse.json({ error: "Server configuration is missing. Add the Supabase secret key to Vercel as SUPABASE_SECRET_KEY." }, { status: 500 });
  }
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
  }

  try {
    const adminCheck = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: publicKey, Authorization: authorization },
      cache: "no-store",
    });
    if (!adminCheck.ok) return NextResponse.json({ error: "Your admin session is invalid. Sign in again." }, { status: 401 });
    const adminUser = await adminCheck.json();
    if (adminUser?.app_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    }

    const input = await request.json();
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim().toLowerCase();
    const projectName = String(input.project_name || "").trim();
    const summary = String(input.summary || "").trim();
    const dueDate = input.due_date ? String(input.due_date) : null;
    if (!name || !email || !projectName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid client name, email, and project name." }, { status: 400 });
    }

    const inviteUrl = new URL(`${url}/auth/v1/invite`);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    inviteUrl.searchParams.set("redirect_to", `${siteUrl}/client`);
    const invite = await fetch(inviteUrl, {
      method: "POST",
      headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, data: { full_name: name, account_type: "client" } }),
      cache: "no-store",
    });
    const invited = await invite.json();
    if (!invite.ok) {
      const detail = invited.msg || invited.message || invited.error_description || "Invitation could not be sent.";
      return NextResponse.json({ error: detail }, { status: invite.status });
    }

    const userId = invited.id;
    if (!userId) return NextResponse.json({ error: "Invitation was accepted by Auth, but no user ID was returned. Check Supabase Auth users before retrying." }, { status: 502 });

    const projectResponse = await fetch(`${url}/rest/v1/client_projects`, {
      method: "POST",
      headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ client_user_id: userId, name: projectName, summary, due_date: dueDate, status: "planning", progress: 0 }),
      cache: "no-store",
    });
    if (!projectResponse.ok) {
      const detail = await projectResponse.text();
      return NextResponse.json({ error: `The client account was invited, but project creation failed. Check the client in Supabase Auth; database response: ${detail}` }, { status: 502 });
    }

    return NextResponse.json({ message: `Invitation sent to ${email}. The client can set their password from the email and sign in at /client.`, user_id: userId });
  } catch (error) {
    console.error("Client invitation failed", error);
    return NextResponse.json({ error: "Unexpected server error while inviting this client." }, { status: 500 });
  }
}
