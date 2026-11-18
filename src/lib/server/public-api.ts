const TABLES = {
  inquiries: "inquiries",
  bookings: "booking_requests",
  newsletter: "newsletter_subscribers",
  events: "site_events",
} as const;

export type PublicTable = keyof typeof TABLES;

export async function insertPublicRecord(table: PublicTable, payload: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Backend is not configured.");

  const response = await fetch(`${url}/rest/v1/${TABLES[table]}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Database request failed.");
  }
}

export function cleanText(value: unknown, max: number, required = false) {
  if (typeof value !== "string") return required ? null : "";
  const cleaned = value.trim();
  if (required && !cleaned) return null;
  return cleaned.slice(0, max);
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}
