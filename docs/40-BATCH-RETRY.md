# Batch Processing & Retry

## Batch

Optional P1 after single import works.

UX can accept multiple URLs, one per line.

Initial processing strategy:

- validate all inputs;
- deduplicate canonical URLs;
- process sequentially or with very small bounded concurrency;
- each product has independent status;
- batch summary shows success/review/failure counts.

Do not add Redis/queue infrastructure for a few demo products.

## Retry

Retry only stages that are safe/idempotent.

Examples:

- source fetch timeout: retry allowed;
- parse error from stable HTML: automatic repeated retry may be pointless;
- database write: carefully retry if operation is idempotent;
- Shopee submission: never blind-retry without knowing whether the first request succeeded.

Record attempt count and last error when useful.

## Production scaling

If the job duration/volume exceeds serverless request limits, move import/upload to a background worker/queue. This is future architecture unless real evidence requires it now.
