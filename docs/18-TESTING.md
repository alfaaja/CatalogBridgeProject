# Testing Strategy

## Test the risky logic first

High-value automated tests:

- JakMall URL validator;
- price parser;
- stock parser;
- weight/dimension normalization;
- structured-data parser;
- representative HTML parser fixtures;
- variant normalization;
- markup calculator;
- duplicate canonical URL logic;
- Shopee mapping statuses (`AUTO`, `REVIEW_REQUIRED`, etc.);
- Shopee draft validation;
- SSRF/security URL edge cases.

## UI tests

Use component tests selectively for:

- import form validation;
- status rendering;
- review-required checklist;
- critical price/markup interaction.

## E2E

Add a small E2E happy path only when the app flow is stable and the tooling cost is justified. Do not install Playwright solely because “E2E testing is good.”

## Fixture policy

Use sanitized static fixtures for parser tests. Do not make unit tests depend on live JakMall network responses.

## Verification baseline

Before a milestone is considered stable:

```bash
npm run lint
npm run build
```

Also run the relevant test command defined in `package.json` after tests are wired.

Do not suppress lint/type errors to force green output.
