# Performance

## Principle

Reasonable responsiveness and resource use are enough. Do not benchmark-chase.

## Import

- single product first;
- bounded timeout;
- no unlimited concurrency;
- batch mode should initially process sequentially or with very small bounded concurrency;
- use retry only for transient errors.

## Frontend

- use Next.js server/client boundaries intentionally;
- do not make every page a client component;
- lazy-load large/non-critical content where useful;
- use optimized/responsive images when compatible with remote-source policy;
- paginate or virtualize only after real data volume requires it.

## Database

Index actual list/filter paths such as status, created time, and source URL uniqueness. Do not add speculative indexes.

## Scaling discussion

If imports become high volume, move scraping/automation to background jobs and introduce queueing, rate control, and worker isolation. This is an interview/future-production discussion unless P0 requires it.
