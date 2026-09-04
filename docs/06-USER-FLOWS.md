# User Flows

## Happy path — single product

1. User signs in if authentication is enabled for the demo.
2. User lands on Dashboard.
3. User selects **Import Product**.
4. User pastes a public JakMall product URL.
5. Client validates basic URL shape; server validates host and network safety.
6. System creates an import/product record and shows progress.
7. Scraper fetches the public source page and extracts available data.
8. Normalizer converts the result into `NormalizedProduct`.
9. User sees the Product Review screen with images, source price, selling price, stock, variants, and completeness indicators.
10. User corrects any `REVIEW_REQUIRED` fields.
11. User opens **Shopee Preview / Prepare for Shopee**.
12. Shopee mapper creates a draft model and identifies unresolved category/attribute requirements.
13. User confirms required manual fields.
14. System prepares/exports or hands off through the verified Shopee integration path.
15. UI displays an honest final status with process history.

## Duplicate URL

1. User submits a previously imported canonical source URL.
2. System does not silently create a duplicate.
3. UI offers **View Existing Product** and, if supported, **Re-import/Refresh**.

## Invalid URL

- Reject non-HTTPS or non-JakMall URLs.
- Explain: “Masukkan link produk JakMall yang valid.”
- Do not make a network request.

## Source unavailable

- Mark import as failed with retry capability.
- Preserve user input and diagnostic code.

## Partial extraction

- Save valid fields.
- Mark missing important fields as review-required.
- Do not discard the entire product when optional data is missing.

## Shopee mapping incomplete

- Show a checklist of unresolved fields.
- Prevent “Ready” state until required mapping is resolved.

## Image failure

- Keep product usable if text data exists.
- Clearly identify images that failed.
- Allow retry or manual replacement if implemented.
