# CatalogBridge

CatalogBridge is a hosted proof of concept for importing public JakMall product
data, reviewing normalized information, and preparing it for Shopee Seller with
less repetitive manual work.

## Technology

- Next.js 16 with React 19 and TypeScript
- Tailwind CSS 4 and shadcn/ui Nova
- Supabase JS and SSR clients
- Zod validation
- Vitest and Testing Library

Exact dependency versions are recorded in `package.json` and `package-lock.json`.

## Local setup

Install the existing dependencies and create a local environment file:

```powershell
npm install
Copy-Item .env.example .env.local
```

Set these variables in `.env.local` using the public values from the Supabase
project:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never place a service-role key or another secret in a `NEXT_PUBLIC_` variable.

Start the development server:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Supabase health check

With the app running, request:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health/supabase
```

The endpoint returns `200` when Supabase is reachable and `503` when its public
configuration is invalid or the upstream service cannot be reached. Public
responses do not include configuration values or raw exceptions.

## Account access

CatalogBridge uses Supabase email/password authentication. The public landing
page is available at `/`, sign-in at `/login`, and account registration at
`/register`. Authenticated users continue into `/dashboard`; product, import,
history, review, mapping, and handoff routes remain session-protected.

Enable the Supabase email provider and new-user signup for the intended project
before testing registration. Configure the Supabase Site URL and allowed
redirect URLs for the deployed CatalogBridge origin so confirmation links do
not return to a local or stale host. CatalogBridge supports both legitimate
provider outcomes: an immediately authenticated signup continues to Dashboard,
while a signup requiring email confirmation shows a neutral check-email state.
The application does not use or require a service-role key, and ownership
remains derived from the authenticated user through RLS.

Versioned schema migrations are under `supabase/migrations`. Apply pending
migrations to the intended Supabase project before testing writes. Generated
database types are kept in `src/lib/supabase/database.types.ts`; regenerate
them from the applied schema rather than editing them by hand.

## Verification

```powershell
npm run test
npm run typecheck
npm run lint
npm run build
```

## Current milestone

The current bounded Milestone 8 polish slice adds a truthful public landing
page, self-service email/password registration, and session-aware routing. It
does not add profiles, roles, OAuth, password recovery, onboarding, schema
changes, or new application features. At the latest local QA, the Supabase
project returned `registration unavailable`; enable new-user signup before
completing the fresh-account and two-account RLS browser checks.

Milestone 7 previously proved the existing pipeline with a second distinct
public JakMall product and added the authenticated Process History page at
`/history`.

The RUMAUMA 380 ml bottle was imported through the existing assisted-HTML path
without parser or normalization changes. The persisted record kept the real
Rp25,000 source price, one trusted product image, the base-variant
representation, and source uncertainty where identifiers or stock were not
confirmed. Product Review and Shopee Mapping were completed locally and the
product remained `READY` after reload. Repeating the canonical URL was rejected
as a duplicate without increasing the two-product total; the original JEP
record remained intact.

Process History uses the existing RLS-protected `process_logs` data, shows up to
the 100 newest activities across the reviewer's products, and links each event
to Product Review. It has no filters or pagination. These records are
operational evidence, not a transactional audit ledger. Shopee handoff entries
still mean package preparation or reviewer confirmation only, never API upload
or publication proof.

Project scope and sequencing are documented in
[`docs/24-IMPLEMENTATION-PLAN.md`](docs/24-IMPLEMENTATION-PLAN.md).
