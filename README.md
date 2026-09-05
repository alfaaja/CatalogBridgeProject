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

## Reviewer access

CatalogBridge uses one manually created Supabase email/password account for the
hosted reviewer. Public signup and anonymous sign-in must remain disabled in
the Supabase project. The application does not use or require a service-role
key.

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

Milestone 4 adds the authenticated Product Review route at `/products/[id]`.
Reviewers can inspect persisted JakMall evidence, correct approved product and
variant business fields, and see a readiness checklist while the product stays
in `REVIEW_REQUIRED`. Source price, source identifiers, imported diagnostics,
and variant option evidence remain read-only. Shopee mapping and preparation
remain Milestone 5 work.

Project scope and sequencing are documented in
[`docs/24-IMPLEMENTATION-PLAN.md`](docs/24-IMPLEMENTATION-PLAN.md).
