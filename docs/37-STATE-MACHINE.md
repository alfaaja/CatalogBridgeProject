# Product / Process State Machine

Keep business-facing status simpler than internal stages.

## Product status

Recommended:

```text
PENDING
  ↓
IMPORTING
  ↓
REVIEW_REQUIRED ↔ READY
                   ↓
                EXPORTED/PREPARED
                   ↓
                UPLOADED (only if verified)
```

Any active stage can become:

```text
FAILED
```

Retry should move through a valid import/prepare stage rather than directly changing `FAILED` to `READY`.

## UI labels

- `PENDING` → Pending
- `IMPORTING` → Importing
- `REVIEW_REQUIRED` → Needs Review
- `READY` → Ready for Shopee
- `EXPORTED/PREPARED` → Prepared
- `UPLOADED` → Uploaded
- `FAILED` → Failed

Only introduce `PUBLISHED` if actual Shopee publication is verified.

## Process log status

Separate event status can use:

- started;
- success;
- warning;
- failed.

Do not overload one enum for every concept.
