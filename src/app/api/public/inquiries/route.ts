import { NextRequest, NextResponse } from "next/server";
import { cleanText, insertPublicRecord, validEmail } from "@/lib/server/public-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    // Quietly accept honeypot submissions without storing spam.
    if (cleanText(input.website, 200)) return NextResponse.json({ ok: true });
    const name = cleanText(input.name, 120, true);
    const email = cleanText(input.email, 254, true);
    const message = cleanText(input.message, 5000, true);
    if (!name || name.length < 2 || !email || !validEmail(email) || !message || message.length < 10) {
      return NextResponse.json({ error: "Please enter a valid name, email and project message (at least 10 characters)." }, { status: 400 });
    }
    await insertPublicRecord("inquiries", {
      name, email: email.toLowerCase(),
      phone: cleanText(input.phone, 40),
      company: cleanText(input.company, 120),
      service_interest: cleanText(input.service_interest, 120),
      budget: cleanText(input.budget, 80),
      message,
    });
    return NextResponse.json({ ok: true, message: "Your enquiry has been received." }, { status: 201 });
  } catch (error) {
    console.error("Public enquiry submission failed", error);
    return NextResponse.json({ error: "We could not send your enquiry right now. Please try again shortly." }, { status: 503 });
  }
}
