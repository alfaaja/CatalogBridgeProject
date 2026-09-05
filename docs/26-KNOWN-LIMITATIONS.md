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
- exact Seller Centre navigation and non-publishing control remain a manual QA
  fact and must not be inferred from CatalogBridge evidence.

Do not hide limitations in the demo. Explain the trade-off and what a production continuation would change.
