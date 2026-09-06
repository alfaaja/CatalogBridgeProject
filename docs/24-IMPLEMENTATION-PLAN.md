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

Implemented as a bounded reliability proof after the M0–M6 path was stable:

- imported a second distinct real public JakMall product through the unchanged
  assisted-HTML pipeline;
- verified Product Review, local Shopee Mapping, persisted `READY` state, and
  duplicate rejection while preserving the existing JEP product;
- added authenticated `/history` using real RLS-protected `process_logs` joined
  to the owned parent product;
- limited History to the newest 100 activities with deterministic Jakarta
  timestamps, explicit business labels, and Product Review links;
- retained warning events and the exact M6 handoff evidence wording without
  turning it into upload, publication, synchronization, or Shopee verification
  claims.

The second product was not transferred to Seller Centre. M7 adds no parser
change, migration, index, dependency, retry, batch input, pricing automation,
or image storage.

Verified second-product evidence:

- canonical URL:
  `https://www.jakmall.com/rumauma-home/rumauma-glass-water-bottle-380ml-bpa-free-botol-minum-olahraga-putih`;
- product ID: `cee3520e-ff91-4edf-956b-4a08fb243c8b`;
- title: `RUMAUMA Glass Water Bottle 380ML BPA Free Botol Minum Olahraga - Putih`;
- source price: Rp25,000; one trusted product image was persisted;
- the public page reported stock availability without an exact quantity. The
  imported quantity remained unknown until the reviewer made the local stock
  decision;
- one base variant was persisted without an invented option mapping. The
  structured offer SKU was `A100416AY`, while the page also displayed
  `Kode SKU 8223205140161`; the source product identifier remained unavailable;
- Dashboard moved from one to two products. A repeat import was rejected as a
  duplicate and the total remained two.

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
