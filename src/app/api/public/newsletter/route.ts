import { NextRequest, NextResponse } from "next/server";
import { cleanText, insertPublicRecord, validEmail } from "@/lib/server/public-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    if (cleanText(input.website, 200)) return NextResponse.json({ ok: true });
    const email = cleanText(input.email, 254, true);
    if (!email || !validEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    try {
      await insertPublicRecord("newsletter", { email: email.toLowerCase(), name: cleanText(input.name, 120) });
    } catch (error) {
      if (error instanceof Error && /duplicate key|unique constraint|23505/i.test(error.message)) {
        return NextResponse.json({ error: "This email is already subscribed." }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ ok: true, message: "You are subscribed." }, { status: 201 });
  } catch (error) {
    console.error("Newsletter subscription failed", error);
    return NextResponse.json({ error: "We could not subscribe you right now. Please try again shortly." }, { status: 503 });
  }
}
