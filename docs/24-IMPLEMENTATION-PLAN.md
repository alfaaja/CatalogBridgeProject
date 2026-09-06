# Implementation Plan

The project is deadline-sensitive. Work vertically and keep a demoable state.

## Milestone 0 — Repository audit & foundation

Goal: verify the existing setup and create a clean project shell without feature creep.

Tasks:

- inspect current Next.js/shadcn/ECC/Supabase files;
- remove accidental duplicate/unused setup files only with evidence;
- confirm environment handling;
- keep health endpoint safe;
- establish module folders only as needed;
- ensure lint/build remain green.

Non-goals: database schema, scraper, full dashboard.

## Milestone 1 — Supabase persistence + minimal auth shell

Goal: persist products/import state and protect the hosted demo if required.

Tasks:

- migrations for minimal tables needed now;
- Supabase clients/server boundaries;
- simple auth path or documented decision to defer;
- RLS/policy strategy;
- basic repository/data access functions;
- tests for critical access/validation logic.

## Milestone 2 — Application shell & business-first UI

Goal: polished navigation and empty/real-data states.

Tasks:

- sidebar/header;
- Dashboard with real counts only;
- Products list empty state;
- Import Product entry point;
- responsive behavior;
- no fake charts.

Use approved Stitch reference if available.

## Milestone 3 — JakMall single-product import

Goal: one real public product URL reaches stored normalized product data.

Tasks:

- URL validation/SSRF protections;
- fetch source;
- structured data/Cheerio parser;
- normalization;
- persist product/images/variants;
- typed errors;
- parser fixtures/tests.

This is a critical milestone. Do not start batch import before it works.

## Milestone 4 — Product review/edit

Goal: business user can inspect and correct imported data.

Tasks:

- product detail/gallery;
- editable title/description/pricing/stock when appropriate;
- variant display/edit if available;
- completeness/review checklist;
- save changes;
- raw/source data behind an advanced tab.

## Milestone 5 — Shopee mapping + preview

Goal: normalized product becomes a transparent Shopee draft.

Tasks:

- mapping statuses;
- category review field;
- category attributes model;
- preview/source comparison;
- required-field validation;
- save mapped draft.

## Milestone 6 — Verified Shopee handoff

Goal: demonstrate the strongest realistic integration available within time/account constraints.

Choose after verification:

- export/prepare artifact;
- Shopee mass-upload template if confirmed;
- official API if legitimate access exists;
- browser automation only if necessary and supportable.

Do not fake completion.

Selected implementation: guided manual handoff. For a current `READY` product,
CatalogBridge builds a server-derived, fingerprinted handoff package and lets a
reviewer attest that the snapshot is retained in an archived, non-published
Seller Centre state. Manual QA observed that Seller Centre accepted the product,
it briefly appeared Live, and the reviewer immediately archived/unlisted it;
the final retained state is `Belum Ditampilkan / Diarsipkan`. Prepared and
reviewer-confirmed evidence is stored in `process_logs` for the current READY
revision only. No migration, new product status, Shopee API, mass-upload file,
or browser automation is part of this milestone, and no publication success is
claimed.

## Milestone 7 — P1 reliability/value-add

Only after P0 works:

- duplicate detection;
- markup configuration;
- import history;
- batch URL input;
- retry;
- stable image storage if needed.

## Milestone 8 — Hardening & deployment

- complete tests;
- security review;
- UX review against anti-slop checklist;
- Vercel deployment;
- production checklist;
- README/limitations/cost/AI disclosure;
- demo rehearsal.

## Stop rule

If a later milestone threatens the working end-to-end demo, stop and preserve the last verified path.
