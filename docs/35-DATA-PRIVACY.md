# Data Privacy

## Data minimization

The app needs product/catalog data and limited demo-account information. It does not need personal buyer data, payment data, or private seller credentials for the PoC.

## Do not persist

- Shopee password;
- OTP/2FA codes;
- session cookies unless a future legitimate automation design explicitly requires secure ephemeral session handling;
- identity documents;
- private email/phone/address in logs/screenshots;
- source-site account credentials.

## Screenshots/demo

Before publishing docs/screenshots:

- crop or redact usernames, email, phone, address, balance, account identifiers;
- never include browser devtools showing tokens;
- use demo data where possible.

## Raw scraped data

Store only the product-source data useful for debugging/reprocessing. Do not save arbitrary page/session content.

## Retention

For the assessment, data retention can be simple. Document any cleanup/reset mechanism used before handing the demo to reviewers.
