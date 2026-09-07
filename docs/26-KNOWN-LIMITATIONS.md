# Known Limitations

Maintain this file as the implementation evolves.

Expected PoC limitations:

- public JakMall page structure can change and require parser maintenance;
- not every JakMall field maps 1:1 to Shopee;
- Shopee category/attribute requirements are category-dependent and can change;
- category mapping may need user confirmation;
- seller authentication/OTP/CAPTCHA cannot and should not be bypassed;
- official Shopee API access may require onboarding/permissions not available during the assessment;
- the PoC is not designed for very high concurrency;
- hosted serverless limits may influence browser-automation feasibility;
- stock/availability may be unknown when the public source does not expose it;
- image rights/usage are a business/legal consideration outside pure technical extraction;
- scraping is maintenance-sensitive and must respect platform rules.

Milestone 6 handoff limitations:

- guided handoff is manual and does not prove an API upload, submission,
  synchronization, or publication;
- Seller Centre confirmation is a structured reviewer attestation, not
  independent machine-verifiable Shopee evidence;
- category choices and dynamic attributes must be reconciled against the live
  Seller Centre form;
- source image URLs are references only, so the reviewer must follow Seller
  Centre's actual image workflow;
- shipping and service availability is account-dependent and must be checked in
  Seller Centre;
- process-log idempotency is application-enforced for the single-reviewer PoC,
  without a database uniqueness constraint or transaction spanning validation
  and evidence insertion;
- manual QA observed that Seller Centre accepted the product, it briefly
  appeared Live, and the reviewer immediately archived/unlisted it; the final
  retained state is `Belum Ditampilkan / Diarsipkan`;
- the archived outcome does not prove an API upload, automated submission, or
  publication success.

Milestone 7 reliability/history limitations:

- the second real-product proof used the assisted-HTML fallback because direct
  server acquisition was blocked by JakMall's WAF; browser automation was not
  added;
- the imported RUMAUMA bottle retained one trusted product image and a base
  variant with honest review warnings; incomplete or conflicting source
  identifiers were not invented;
- Process History shows only the latest 100 persisted activities and has no
  pagination, filtering, export, retry, or auto-refresh;
- the existing `(product_id, created_at desc, id)` index favors per-product
  history rather than the bounded cross-product sort; this is acceptable only
  for the current single-reviewer PoC volume;
- process logs are operational evidence and can be incomplete if a business
  write succeeds but its best-effort log append fails; they are not a
  transactional audit ledger;
- History continues to show reviewer-confirmed M6 handoff evidence as
  attestation, not independent Shopee or publication verification.

Local Auto Send limitations:

- the local runner must be installed and running; Vercel does not run
  Playwright or retain a Shopee session;
- Shopee login, CAPTCHA, 2FA, and device verification remain manual and are not
  bypassed;
- exact authenticated Add Product field selectors have not yet been captured,
  so the current runner stops before form interaction with
  `SELLER_FORM_NOT_VERIFIED`;
- Seller Centre DOM changes, category/required-attribute changes, or missing
  account-side shipping can require reviewer action;
- image downloading is restricted to trusted JakMall HTTPS references and
  validated temporary files; image use rights remain a business decision;
- multi-variant automation requires both confirmed source option mapping and
  deterministic labeled Seller Centre rows; DOM order alone is rejected;
- dry-run is the default, and no automatic publishing/display state exists;
- upload-job and process-log records are operational evidence, not tamper-proof
  audit records;
- Manual Handoff remains available whenever local automation cannot proceed.

Do not hide limitations in the demo. Explain the trade-off and what a production continuation would change.
