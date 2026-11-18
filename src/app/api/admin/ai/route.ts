import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function isAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ") || !SUPABASE_URL || !SUPABASE_KEY) return false;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: authorization },
      cache: "no-store",
    });
    if (!response.ok) return false;
    const user = await response.json();
    return user?.app_metadata?.role === "admin";
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: "Administrator access required." }, { status: 401 });
  return NextResponse.json({ configured: Boolean(OPENAI_API_KEY), model: process.env.OPENAI_MODEL || "gpt-5.5" });
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) return NextResponse.json({ error: "Administrator access required." }, { status: 401 });
  if (!OPENAI_API_KEY) return NextResponse.json({ error: "OpenAI is not configured yet. Add OPENAI_API_KEY to the Vercel project environment variables, then redeploy." }, { status: 503 });

  try {
    const body = await request.json();
    const messages = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];
    if (!messages.length || messages.some((item: { role?: string; content?: string }) =>
      !["user", "assistant"].includes(item?.role || "") ||
      typeof item?.content !== "string" ||
      item.content.length > 4000
    )) {
      return NextResponse.json({ error: "Send up to 12 valid chat messages. Each message must be under 4,000 characters." }, { status: 400 });
    }

    const input = messages.map((item: { role: "user" | "assistant"; content: string }) => ({
      role: item.role,
      content: [{ type: item.role === "assistant" ? "output_text" : "input_text", text: item.content.trim() }],
    }));

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        instructions: "You are VELTRIX Studio AI, an assistant available only to the authenticated VELTRIX administrator. Help with agency operations, client communication, proposals, service descriptions, marketing copy, project planning, and interpreting business information supplied by the admin. Use clear, polished, practical language. VELTRIX is a premium digital studio offering websites, e-commerce, web applications, UI/UX, AI automation, and digital growth. Do not claim to access the website database or send messages. Never invent prices, client facts, project status, or analytics. Treat all pasted client information as confidential; remind the admin to avoid sharing passwords, API keys, payment details, or unnecessary personal data. If asked to perform an action, provide a draft or instructions rather than claiming the action was completed.",
        input,
        max_output_tokens: 900,
        store: false,
      }),
      cache: "no-store",
    });

    const result = await upstream.json();
    if (!upstream.ok) {
      const detail = result?.error?.message || "OpenAI could not complete the request.";
      return NextResponse.json({ error: detail }, { status: upstream.status === 429 ? 429 : 502 });
    }

    const answer = Array.isArray(result.output)
      ? result.output.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content || [])
          .filter((part: { type?: string }) => part.type === "output_text")
          .map((part: { text?: string }) => part.text || "")
          .join("\n")
      : "";
    if (!answer) return NextResponse.json({ error: "The AI returned an empty response. Please try again." }, { status: 502 });
    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ error: "Could not reach the AI service. Please try again." }, { status: 502 });
  }
}
