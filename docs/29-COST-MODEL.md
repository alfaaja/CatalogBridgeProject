# Cost Model

## PoC target

Keep recurring cost at or near free-tier level where possible.

## Expected components

### Development

- Next.js/TypeScript/open-source packages: no license cost.
- ECC: open-source tooling; user already installed it.
- Codex/ChatGPT/Stitch usage depends on the candidate's existing subscriptions/quotas and should be disclosed separately from runtime infrastructure.

### Runtime

- Vercel: target free/low-cost tier for PoC deployment, subject to current provider limits.
- Supabase: target free/low-cost tier for PoC database/auth/storage, subject to current provider limits.
- No Redis/queue/paid observability unless required.

## Production continuation

Potential future costs:

- higher Vercel/Supabase plan for traffic/storage;
- dedicated worker/browser infrastructure;
- observability;
- object storage/egress;
- Shopee partner/API operational requirements if applicable.

Before final interview, verify current public pricing rather than quoting stale numbers from this document.
