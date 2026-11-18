import { NextRequest, NextResponse } from "next/server";
import { cleanText, insertPublicRecord } from "@/lib/server/public-api";

export const runtime = "nodejs";

const allowedEvents = new Set(["page_view", "quote_open", "inquiry_submit"]);

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    const eventType = cleanText(input.event_type, 40, true);
    const path = cleanText(input.path, 500, true);
    const sessionId = cleanText(input.session_id, 100, true);
    if (!eventType || !allowedEvents.has(eventType) || !path || !sessionId || sessionId.length < 8) {
      return NextResponse.json({ error: "Invalid analytics event." }, { status: 400 });
    }
    await insertPublicRecord("events", { event_type: eventType, path, session_id: sessionId });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Analytics event failed", error);
    return NextResponse.json({ error: "Analytics event could not be recorded." }, { status: 503 });
  }
}
