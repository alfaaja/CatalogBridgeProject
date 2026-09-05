# Architecture Decision Log

## ADR-001 — TypeScript + Next.js

Decision: use one full-stack TypeScript application.

Why: fast PoC delivery, one language across UI/server/domain, good Codex familiarity, simple deployment.

## ADR-002 — Modular monolith

Decision: no microservices for the PoC.

Why: lower complexity and better demo reliability. Module boundaries provide separation without operational overhead.

## ADR-003 — Supabase

Decision: use Supabase for hosted persistence and optional Auth/Storage.

Why: managed Postgres, low setup/operational cost, visual inspection, deployment-friendly.

## ADR-004 — No Prisma initially

Decision: use Supabase client/server patterns instead of adding Prisma unless a concrete need appears.

Why: reduce dependencies and migration/runtime complexity for a short PoC.

## ADR-005 — Fetch/Cheerio first

Decision: normal HTTP extraction before browser automation.

Why: cheaper, faster, easier to test, easier to deploy.

## ADR-006 — Playwright only as fallback

Decision: do not install browser automation until evidence proves it is required.

## ADR-007 — Flexible category attributes

Decision: dynamic category attributes use structured JSON/key-value data rather than columns such as `voltage`, `cable_length`, etc.

Why: Shopee attributes vary by category.

## ADR-008 — Business-first UI

Decision: use non-technical language and product-focused visuals.

Why: primary reviewer/user is business-oriented and the assessment explicitly values usability.

## ADR-009 — Stitch as design reference, not code authority

Decision: Stitch can explore and approve visual direction, but Codex implements the approved design using the existing project component system.

Why: avoid generated markup lock-in and AI-slop UI.

## ADR-010 — Truthful Shopee states

Decision: distinguish ready/prepared/exported/uploaded/published states.

Why: proof of result must be credible and not fabricated.

## ADR-011 — Guided manual Shopee handoff

Decision: Milestone 6 prepares a snapshot-scoped, copy-ready handoff for manual
entry in Seller Centre and records prepared and reviewer-confirmed evidence in
`process_logs`.

Why: no official mass-upload contract or legitimate API access was verified for
the deadline path. The READY revision participates in the fingerprint so old
evidence cannot become current again after reopening and re-readying a product.
Reviewer confirmation remains explicitly distinct from independent Shopee
verification or publication.
