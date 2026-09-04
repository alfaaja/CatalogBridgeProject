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

Do not hide limitations in the demo. Explain the trade-off and what a production continuation would change.
