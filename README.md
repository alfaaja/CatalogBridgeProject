# CatalogBridge

CatalogBridge is a hosted proof of concept that imports public JakMall product
data, preserves source fidelity, lets a reviewer prepare a Shopee listing, and
hands an approved snapshot to either a guided manual flow or a local Shopee
runner.

The web application is a Next.js modular monolith deployed on Vercel. Supabase
provides email/password authentication, PostgreSQL persistence, and row-level
ownership. The optional Playwright runner is a separate local package; it is
never bundled into the Vercel application.

## Product flow

1. Submit a canonical JakMall product URL.
2. CatalogBridge attempts a normal server fetch. If JakMall browser
   verification/WAF blocks that request, the form reveals an assisted saved-HTML
   fallback without clearing the URL.
3. Structured source data remains authoritative; bounded semantic HTML only
   supplements fields that the saved evidence actually proves.
4. Review normalized product data and map only reviewed Shopee values.
5. Mark the product `READY` after all blockers are resolved.
6. Choose **Auto Send to Shopee** or the existing **Manual Handoff**.

No flow automatically publishes or displays a listing. The only permitted
terminal automation action is the exact Seller Centre control **Simpan &
Arsipkan**. Job status `SAVED_ARCHIVED` means the retained archived,
non-published state was verified; it never means published.

## Technology

- Next.js 16, React 19, TypeScript, Tailwind CSS 4, and shadcn/ui
- Supabase JS/SSR, PostgreSQL, Auth, grants, and RLS
- Zod, Vitest, and Testing Library
- isolated local runner: Node.js, Playwright, Supabase JS, and Zod

Exact web and runner versions are locked in their respective package files.

## Web setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Configure only the public project values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never place a service-role key, database password, user token, Shopee
credential, or browser cookie in this repository or a `NEXT_PUBLIC_` variable.
Apply committed migrations to the intended Supabase project and regenerate
`src/lib/supabase/database.types.ts` from that applied schema.

With the app running, the secret-free Supabase probe is available at:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health/supabase
```

For deployment, set the Supabase Site URL to the stable Vercel production URL
and allow both the production origin and localhost development origin as auth
redirects. Do not hard-code preview URLs in application source.

## Local Shopee runner

The runner uses the same user's Supabase session and RLS. It prompts for the
CatalogBridge email/password in the terminal, keeps the resulting session in
memory only, and opens a persistent Shopee browser profile under
`~/.catalogbridge/shopee-profile`. That profile and optional local evidence
never leave the machine.

```powershell
cd runner
npm install
npx playwright install chromium
$env:CATALOGBRIDGE_SUPABASE_URL="https://your-project.supabase.co"
$env:CATALOGBRIDGE_SUPABASE_PUBLISHABLE_KEY="your-public-key"
npm run start
```

`AUTOMATION_DRY_RUN` defaults to `true`. A future verified real archive-save
run must explicitly set it to `false`. The reviewer must complete normal Shopee
login, CAPTCHA, 2FA, and device checks in the opened browser; CatalogBridge does
not request Shopee credentials, export cookies, read OTPs, or bypass access
controls.

The runner currently implements and tests the job/authentication boundary,
strict manifest, stale-READY guard, trusted-image download lifecycle, base
listing plan, exact category/variant guards, and exact Save & Archive guard.
Field selectors for the authenticated Seller Centre form still require one real
evidence pass. Until then, the runner stops with `SELLER_FORM_NOT_VERIFIED`
before filling or saving. Manual Handoff remains the working fallback.

See [`runner/README.md`](runner/README.md) for operating and safety details.

## Verification

```powershell
npm run test
npm run typecheck
npm run lint
npm run build

Set-Location runner
npm run test
npm run typecheck
```

## Security and limitations

- Upload jobs contain only a strict allowlisted READY snapshot—never raw HTML,
  raw parser diagnostics, credentials, sessions, or cookies.
- The web action rebuilds the manifest from persisted owned state and never
  accepts caller-controlled `owner_id` or listing fields.
- The runner processes one owned job at a time with the public Supabase key; no
  service-role client exists.
- Seller Centre DOM/category/required attributes and seller shipping settings
  can change and require manual action.
- Multi-variant automation requires confirmed source mapping and deterministic
  Seller Centre row labels; ambiguous mapping stops safely.
- Process logs are useful operational evidence, not a tamper-proof audit ledger.
- There is no automatic publishing and no claim of official Shopee API upload.

The architecture remains low-cost: Vercel, Supabase, and a local runner; there
is no paid proxy, CAPTCHA service, scraping SaaS, queue SaaS, or remote browser.
The implementation was developed with AI coding assistance and manually
reviewed/tested against real source and Seller Centre evidence where explicitly
documented. Unverified behavior is kept fail-closed rather than presented as a
successful integration.

## Demo path and current status

Use an existing READY base product (RUMAUMA or JEP), open Shopee Mapping, and
show the two truthful choices: Auto Send and Manual Handoff. The web/job/runner
foundation is implemented and automated-tested. Real automated Seller Centre
field fill and archive-save are **user-action pending** because the exact
authenticated field controls have not yet been captured. Prior manual QA only
proved that Seller Centre accepted JEP, it briefly appeared Live, and the
reviewer immediately archived it; its final retained state was
`Belum Ditampilkan / Diarsipkan`.

Project scope is documented in
[`docs/24-IMPLEMENTATION-PLAN.md`](docs/24-IMPLEMENTATION-PLAN.md), and current
automation limitations in
[`docs/26-KNOWN-LIMITATIONS.md`](docs/26-KNOWN-LIMITATIONS.md).
