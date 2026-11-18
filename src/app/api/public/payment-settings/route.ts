import { NextResponse } from "next/server";

export const runtime = "nodejs";
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!URL || !SECRET) return NextResponse.json({ error: "Payment settings are unavailable." }, { status: 503 });
  try {
    const response = await fetch(URL + "/rest/v1/site_settings?select=value&key=eq.instapay_payment_details&limit=1", {
      headers: { apikey: SECRET, Authorization: "Bearer " + SECRET },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(await response.text());
    const rows = await response.json();
    const value = rows?.[0]?.value || {};
    return NextResponse.json({
      handle: typeof value.handle === "string" ? value.handle.slice(0, 180) : "",
      instructions: typeof value.instructions === "string" ? value.instructions.slice(0, 1000) : "",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Public InstaPay settings load failed", error);
    return NextResponse.json({ error: "Could not load payment details." }, { status: 500 });
  }
}
