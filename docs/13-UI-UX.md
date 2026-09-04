# UI / UX Specification

## UX objective

A non-technical business reviewer should understand the app's purpose and next action within roughly 30–60 seconds without a technical explanation.

## Information architecture

Recommended primary navigation:

- Dashboard
- Products
- Import Product
- History
- Settings (only if it contains real settings)

Avoid adding empty sections solely to make the sidebar look complete.

## Core screens

### Login

Simple centered authentication surface. No marketing landing page is required for the assessment.

### Dashboard

Purpose: operational overview and primary action.

Include only real metrics, for example:

- Total Products
- Ready for Shopee
- Needs Review
- Failed

Main CTA: **Import Product**.

Recent products should show image, name, price, and status. Do not fabricate charts.

### Import Product

- one large JakMall URL field;
- clear accepted-source hint;
- optional batch mode only after single import works;
- progressive import status;
- friendly validation.

User-facing terminology:

- “Import Product”, not “Scrape URL”;
- “Preparing product”, not “Normalizing entity”;
- “Needs Review”, not “Mapper incomplete”.

### Product List

Prefer a table/list over a grid of giant cards.

Columns can include:

- image + product name;
- source price;
- selling price;
- stock;
- status;
- updated time;
- action menu.

Support search and status filter when useful.

### Product Detail / Review

Sections:

1. product identity and gallery;
2. pricing;
3. product information;
4. variants;
5. shipping/physical data;
6. Shopee readiness;
7. optional technical/source data tab.

Primary actions should be obvious: Save, Retry, Prepare for Shopee.

### Shopee Preview

Use an understandable before/after relationship:

- left/source: JakMall;
- right/destination: Shopee-ready draft.

Show missing fields as an actionable checklist.

### History

A chronological process table/timeline with real events, status, product, timestamp, and retry/details.

## Feedback patterns

- skeleton only where content shape is known;
- progress with meaningful stages for import;
- Sonner/toast for short confirmations, not critical errors;
- inline error near the field/action causing it;
- destructive action requires confirmation when meaningful.

## Responsive behavior

Desktop is primary, but tablet/mobile must remain usable. On small screens:

- sidebar collapses;
- tables can become stacked rows or horizontally scroll with explicit affordance;
- primary action stays reachable;
- no clipped dialogs.
