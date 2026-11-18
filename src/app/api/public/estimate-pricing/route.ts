import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const defaults = {
  types: [
    { id: "website", name: "Business website", base: 4500 },
    { id: "ecommerce", name: "E-commerce", base: 8000 },
    { id: "application", name: "Web application", base: 10000 },
    { id: "design", name: "UI/UX design", base: 2500 },
    { id: "ai", name: "AI & automation", base: 6000 },
    { id: "custom", name: "Custom platform", base: 10000 },
    { id: "growth", name: "Digital growth & care", base: 2500 },
  ],
  features: [
    { id: "cms", label: "Content management", price: 700 },
    { id: "auth", label: "User accounts & roles", price: 1200 },
    { id: "payments", label: "Payments & checkout", price: 1800 },
    { id: "dashboard", label: "Custom dashboard", price: 1800 },
    { id: "integrations", label: "Third-party integrations", price: 1000 },
    { id: "multilingual", label: "English & Arabic", price: 700 },
    { id: "motion", label: "Advanced motion & 3D", price: 1500 },
    { id: "seo", label: "SEO foundations", price: 500 },
  ],
  multipliers: { essential: 0.9, standard: 1, premium: 1.35, rush: 1.2 },
};

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json(defaults);
  try {
    const response = await fetch(`${url}/rest/v1/site_settings?select=value&key=eq.quote_estimator_pricing`, {
      headers: { apikey: key }, cache: "no-store",
    });
    if (!response.ok) return NextResponse.json(defaults);
    const rows = await response.json();
    const value = rows?.[0]?.value;
    if (!value || !Array.isArray(value.types) || !Array.isArray(value.features)) return NextResponse.json(defaults);
    return NextResponse.json(value, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(defaults);
  }
}
