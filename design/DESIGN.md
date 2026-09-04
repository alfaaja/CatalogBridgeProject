# CatalogBridge Design Rules

This file is designed to be easy to import/reference in AI design tools such as Google Stitch and to share with Codex. It is a visual source of truth, not a replacement for application requirements.

## Product

CatalogBridge is an internal e-commerce operations web application that helps a business user import products from JakMall, review them, and prepare them for Shopee.

## Design intent

The interface should feel:

- precise;
- trustworthy;
- professional;
- calm;
- operational;
- modern without looking trendy for its own sake.

The app must not look like a generic AI-generated SaaS landing page.

## User

Primary user is non-technical. The UI must explain status and next action without exposing implementation jargon.

## Visual hierarchy

1. current task / page title;
2. primary action;
3. product identity and image;
4. readiness/status;
5. editable business fields;
6. secondary technical detail.

## Existing system

- Geist typography;
- Lucide icons;
- shadcn/ui Nova baseline;
- neutral surfaces;
- restrained primary accent;
- semantic status colors.

## Layout

Desktop-first operations layout with responsive sidebar.

- content max width should not make data tables artificially narrow;
- forms use sections/dividers rather than a separate card for every group;
- use a two-column product review layout where it improves comparison;
- keep key actions visible without excessive sticky elements.

## Card policy

Use cards only for semantic objects:

- metric summary;
- product preview;
- bounded alert/summary.

Do not use a card as a default padding container.

## Forbidden visual tropes

- gradient hero backgrounds;
- purple/cyan neon palette;
- glass panels;
- glowing borders;
- huge “AI” sparkles;
- decorative orb/blob backgrounds;
- fake graphs;
- excessive pills/badges;
- giant rounded rectangles everywhere;
- oversize marketing headline in dashboard;
- card-in-card nesting.

## Data UI

- Products: table/list.
- History: table/timeline.
- Status: icon + text + restrained badge where useful.
- Product detail: image/gallery + structured fields.
- Shopee readiness: checklist, not a decorative chart.

## Copy

Prefer concrete business language:

- Import Product
- Needs Review
- Ready for Shopee
- Prepare for Shopee
- Try Again
- View Product

Avoid:

- Supercharge your workflow
- Unlock powerful automation
- AI-powered magic
- Next-generation commerce

## Accessibility

- visible focus;
- readable contrast;
- labeled controls;
- status not color-only;
- keyboard-friendly interactions.
