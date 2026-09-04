# Approved Stitch Visual References

These screenshots represent the approved visual direction for CatalogBridge.

They are visual references, not production implementation code.

## Source of truth order

1. `design/DESIGN.md`
2. Project requirements in `docs/`
3. Approved screenshots in this directory
4. Stitch-generated design notes

If a screenshot conflicts with product behavior or architecture documentation,
the project documentation wins.

## Approved screens

- `dashboard.png`
- `import-product.png`
- `products.png`
- `product-review.png`
- `prepare-shopee.png`
- `history.png`

## Implementation rules

Recreate the layouts using the existing project stack:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui Nova
- Geist
- Lucide icons

Do not copy Stitch-generated HTML/CSS into the application.

## Important corrections

- Use Geist sans-serif throughout.
- Stitch sample products and metrics are illustrative only.
- Never hard-code fake metrics as real application data.
- Store names, prices, commissions, margins, product counts, and history counts
  shown in screenshots are not authoritative business data.
- Technical diagnostics must remain secondary and collapsed.
- Do not implement functionality merely because a mock design appears to show it.
- The actual application state must come from real application data.

## Product UX goal

The interface should be understandable to a non-technical business user
without exposing scraper, parser, worker, HTTP, pipeline, or infrastructure terminology.