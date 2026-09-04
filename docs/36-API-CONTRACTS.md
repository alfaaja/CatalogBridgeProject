# API / Server Contracts

Exact route names can evolve; preserve semantic contracts.

## Import product

Input:

```json
{ "url": "https://...jakmall..." }
```

Success should return an identifier/status, not a giant unvalidated raw document.

Errors use stable codes from `16-ERROR-HANDLING.md`.

## Product list/detail

Return normalized display data. Raw source data should be requested only from an advanced/debug endpoint or server component that needs it.

## Product update

Validate editable fields with Zod. Never allow arbitrary object patching directly into database rows.

## Shopee prepare

Input: product id plus explicit user-confirmed mapping fields if needed.

Output: mapped draft + validation/review issues.

## Health

Health endpoint should confirm service connectivity without exposing keys, URLs that need not be public, schema details, stack traces, or user data.

## Response model

Prefer a consistent result shape for application APIs, e.g.:

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }
```

Do not force every internal function into HTTP-style results.
