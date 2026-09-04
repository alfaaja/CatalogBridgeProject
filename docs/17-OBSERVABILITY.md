# Observability

## PoC-level observability

Do not add paid monitoring unless necessary.

Capture enough evidence to debug and demonstrate:

- product/import id;
- stage;
- status;
- start/end timestamp;
- duration where useful;
- error code;
- concise diagnostic metadata.

## Suggested stages

- validate_url
- fetch_source
- parse_source
- normalize_product
- persist_product
- prepare_shopee
- export_shopee
- submit_shopee (only if implemented)

## Logging rules

Never log:

- passwords;
- cookies;
- bearer tokens;
- secret keys;
- OTPs;
- full authorization headers.

Avoid storing full HTML unless it is necessary and safe. Prefer selected structured raw data/diagnostics.

## UI history

History should show user-relevant events, not raw console logs. Technical details can be expandable.
