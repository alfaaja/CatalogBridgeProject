# Demo & Interview Guide

## Two-minute demo

1. Open public CatalogBridge URL.
2. Show Dashboard and explain one sentence: “Tool ini memindahkan data produk JakMall ke draft listing Shopee dengan review minimal.”
3. Paste a known-good JakMall URL.
4. Show import progress.
5. Open Product Review: title, images, price, stock/variants if available.
6. Show one review-required field such as Shopee category.
7. Open Shopee Preview and show source → destination mapping.
8. Prepare/export/use the verified Shopee handoff.
9. Show final status/history.

## Five-minute technical narrative

1. Problem and assumptions.
2. Architecture: Next.js modular monolith + Supabase + adapters.
3. Extraction strategy: structured data/Cheerio first, browser fallback only if needed.
4. Raw → normalized → Shopee draft separation.
5. Security: allowlisted public URLs, no credential/2FA bypass, env secrets.
6. Reliability: typed errors, review states, parser tests.
7. Trade-offs and cost.
8. Limitations and production evolution.

## Likely questions

### Why TypeScript/Next.js instead of Python?

One language across the hosted full-stack PoC, faster iteration/deployment, Playwright remains available if browser automation becomes necessary. Python would also be valid but adds another runtime for this scope.

### Why Supabase?

Hosted Postgres/Auth/Storage with low setup and operational overhead, suitable for a small public PoC.

### Why no microservices/queue?

The assessment values a small working PoC. Queue/workers become relevant with higher volume or long-running browser jobs.

### What if JakMall changes HTML?

Structured data is preferred, parser logic is isolated, fixtures/tests detect breakage, and failures are explicit.

### Why can category require manual review?

Shopee categories/attributes are destination-specific and not always 1:1 with supplier data. Silent guesses risk incorrect listings.

### What did AI do?

Answer using `30-AI-USAGE.md` honestly.
