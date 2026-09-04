# Stitch Prompt Pack

Copy one prompt at a time. Iterate; do not ask Stitch to design the entire product in one shot.

## 1 — Dashboard

```text
Design a desktop-first internal e-commerce operations dashboard called CatalogBridge.

Primary user: a non-technical business operator.
Primary job: import products from JakMall, review them, and prepare them for Shopee.

Use a restrained professional B2B visual language: neutral surfaces, Geist-like typography, Lucide-style icons, clear spacing, subtle borders, minimal shadow, moderate information density.

Layout:
- collapsible left sidebar with Dashboard, Products, Import Product, History;
- top page title and one clear Import Product primary action;
- four compact real operational metric cards: Total Products, Ready for Shopee, Needs Review, Failed;
- a Recent Products table with product thumbnail, name, source price, selling price, status, updated time;
- a useful empty state if there are no products.

Do not include charts unless they answer a real operational question. Do not include a marketing hero, gradient, glassmorphism, AI sparkles, glowing elements, fake revenue, or excessive rounded cards. Product thumbnails should be the strongest visual content.
```

## 2 — Import Product

```text
Design the CatalogBridge Import Product screen for a non-technical business operator.

The main task is extremely simple: paste a public JakMall product URL and import it.

Use the same restrained business design system as the dashboard.

Include:
- page title and short plain-language explanation;
- one prominent JakMall URL field;
- Import Product primary button;
- accepted-source hint;
- inline validation state;
- import progress state with meaningful steps: Validating link, Reading product, Product details, Images & variations, Preparing data;
- success state with View Product action;
- failure state with Try Again and concise explanation.

Avoid technical words such as scraper, parser, normalization, worker, HTTP, JSON. Avoid decorative cards and generic AI SaaS visuals.
```

## 3 — Products Table

```text
Design a business operations Products screen for CatalogBridge.

Use a table/list as the main collection, not a grid of large cards.

Columns: product image + name, source price, selling price, stock, status, last updated, actions.
Include search, a compact status filter, and an Import Product button.
Statuses: Ready for Shopee, Needs Review, Importing, Prepared, Failed.

The layout should remain readable with 20-50 products. Avoid fake analytics and excessive whitespace.
```

## 4 — Product Review

```text
Design the most important CatalogBridge screen: Product Review.

Goal: a non-technical user quickly verifies imported JakMall data before preparing it for Shopee.

Desktop layout:
- breadcrumb/back to Products;
- product status and primary action at top;
- left area: large primary product image with compact gallery;
- right area: product title, source price, selling price, markup control, stock, SKU;
- below: clean sections for Product Information, Variations, Shipping & Physical Data, Shopee Readiness;
- unresolved fields use an actionable checklist with clear warning labels;
- actions: Save Changes and Prepare for Shopee;
- secondary tabs may include Source Data and Activity, but keep technical information out of the main business view.

Use section headings/dividers instead of wrapping every form section in a card. No card-inside-card design. No gradients/glass/neon.
```

## 5 — Shopee Preview

```text
Design a CatalogBridge Shopee Preview / Prepare screen.

Goal: visually explain how the imported JakMall product will become a Shopee listing.

Use a clear source-to-destination comparison:
- JakMall source summary on the left;
- Shopee-ready draft on the right;
- product image, title, source/selling price, stock, variants;
- a readiness checklist below for Category, Brand, Attributes, Weight, Images, Variations;
- unresolved fields have clear Select/Confirm actions;
- one final primary action: Prepare for Shopee.

Do not make it look like a marketing comparison table. Keep it operational, calm, and precise.
```

## 6 — History

```text
Design a CatalogBridge Process History screen.

Use a chronological table/timeline showing real product operations: product, action/stage, status, time, duration if useful, and Details/Try Again action.

Business-friendly statuses are primary. Technical error codes appear only inside an expandable detail panel.

No fake activity charts, no decorative timeline illustration, no excessive badges.
```

## Critique prompt

```text
Critique this screen as a senior product designer for an internal commerce operations tool.
Identify any signs of generic AI-generated SaaS design: unnecessary cards, gradients, inflated whitespace, fake analytics, oversized headings, low information density, vague copy, excessive badges, decorative elements without function, or unclear next actions.
Then revise the design to be more deliberate, business-like, compact, and task-focused while preserving accessibility.
```
