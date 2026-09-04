# Risk Register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---:|---|
| JakMall DOM changes | Import failure | Medium | structured data first, isolated parsers, fixtures, clear errors |
| JakMall requires JS rendering | Missing data | Medium | verify real pages; Playwright fallback only if necessary |
| Shopee category schema changes | Mapping incomplete | High | dynamic attributes + review-required state |
| Shopee API inaccessible | Automated submission blocked | High | adapter architecture + verified export/manual handoff |
| CAPTCHA/OTP | Automation pause | High | manual legitimate completion; never bypass |
| Serverless timeout | Long import fails | Medium | simple fetch path; bounded requests; background worker only if needed |
| SSRF through URL input | Security issue | Medium | HTTPS + hostname allowlist + redirect/IP checks |
| Secrets leaked to Git | Severe | Low/Medium | `.gitignore`, env review, security scan, no screenshots of secrets |
| AI-generated overengineering | Deadline/misunderstanding | High | milestone scope, AGENTS anti-slop rules, ECC plan/review |
| AI-slop visual design | Poor reviewer perception | High | design system, Stitch brief, UI audit |
| Fake/placeholder demo metrics | Trust loss | Medium | show only real database counts/states |
| Image hotlink instability | Broken previews | Medium | storage fallback if required; source URL metadata retained |
| Production migration mistake | Demo outage | Medium | reproducible migrations; avoid destructive late changes |
