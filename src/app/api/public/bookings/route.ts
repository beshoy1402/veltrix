import { NextRequest, NextResponse } from "next/server";
import { cleanText, insertPublicRecord, validEmail } from "@/lib/server/public-api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();
    if (cleanText(input.website, 200)) return NextResponse.json({ ok: true });
    const name = cleanText(input.name, 120, true);
    const email = cleanText(input.email, 254, true);
    const phone = cleanText(input.phone, 40, true);
    if (!name || name.length < 2 || !email || !validEmail(email) || !phone) {
      return NextResponse.json({ error: "Please enter your name, a valid email and phone number." }, { status: 400 });
    }
    const preferredDate = cleanText(input.preferred_date, 10);
    if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      return NextResponse.json({ error: "Please choose a valid preferred date." }, { status: 400 });
    }
    await insertPublicRecord("bookings", {
      name, email: email.toLowerCase(), phone,
      service_interest: cleanText(input.service_interest, 120),
      preferred_date: preferredDate || null,
      preferred_time: cleanText(input.preferred_time, 40),
      notes: cleanText(input.notes, 2000),
    });
    return NextResponse.json({ ok: true, message: "Your consultation request has been received." }, { status: 201 });
  } catch (error) {
    console.error("Booking request failed", error);
    return NextResponse.json({ error: "We could not send your request right now. Please try again shortly." }, { status: 503 });
  }
}
