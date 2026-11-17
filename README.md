# VELTRIX — Digital Innovation Studio

A bilingual (English / Arabic) agency website and client workspace built with Next.js, React and TypeScript.

## Local development

1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Run `npm run dev` and open http://localhost:3000.

## Supabase

The application uses the existing VELTRIX Supabase project.

- Public project URL and publishable key are used by browser-side public forms.
- Never add a Supabase service-role or secret key to a `NEXT_PUBLIC_*` variable or commit it.
- `supabase/schema.sql` documents the additional booking, newsletter, anonymous analytics, client-project and project-update tables and RLS policies.
- Existing `services` and `inquiries` tables power the public service pricing and project enquiries.
- RLS authorizes studio administration only when the signed-in user has `app_metadata.role = admin`. Do not use user-editable metadata for authorization.

## Routes

- `/` — Public agency website, English/Arabic, services, concept portfolio, project enquiry, consultation request and newsletter signup.
- `/admin` — Private studio dashboard for enquiries, service prices/publication, bookings, newsletter subscribers, client projects and project updates.
- `/client` — Authenticated client portal for assigned project progress and updates.

Client accounts must first be created/invited in Supabase Auth. In the admin dashboard, assign a project using that client's Auth user UUID. The client portal only exposes projects assigned to the signed-in user through RLS.

## Deployment

The Vercel project needs the two public Supabase environment variables above in Preview, Production and Development. A push to the connected production branch will trigger a production deployment. Preview builds are used before merging.

## Portfolio integrity

The portfolio cards are clearly labelled illustrative concepts, not completed client projects. Replace them with approved real project URLs and screenshots before presenting them as client case studies.

## Security notes

- Public browser operations use only the Supabase publishable key and are constrained by RLS.
- Admin and client routes use Supabase Auth access tokens and verify the session with Supabase Auth.
- No service-role key or private credential belongs in this repository.
- The consultation form sends a request; it does not confirm a calendar slot automatically.
