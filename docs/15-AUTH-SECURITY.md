# Authentication & Security

## Authentication

Use Supabase Auth if access control is enabled for the hosted demo.

For the assessment, a single demo/reviewer account is sufficient unless requirements change. Do not build enterprise RBAC.

## Secrets

Never commit:

- `.env.local`;
- database passwords;
- Supabase secret/service-role keys;
- Shopee passwords;
- access/refresh tokens;
- cookies/session exports;
- OTPs;
- private identity documents.

Public/publishable keys may be browser-safe by design, but should still be configured through environment variables rather than copied through arbitrary source files.

## Supabase boundaries

- browser client uses publishable key and user session;
- privileged operations belong server-side only when actually needed;
- if a service-role/secret key becomes necessary, it must never use a `NEXT_PUBLIC_` variable;
- RLS/policies must match the final access path.

## SSRF protection for scraper

Before server fetch:

1. parse URL;
2. require HTTPS;
3. allowlist expected JakMall hostname(s);
4. reject credentials in URL;
5. reject unexpected ports;
6. validate redirect destinations;
7. reject private/loopback/link-local resolution where applicable;
8. set timeout and response size limits.

## HTML/content safety

- do not dangerously render arbitrary source HTML;
- sanitize or convert descriptions to safe text/controlled markup;
- validate image URLs;
- do not execute scripts from scraped content.

## Platform controls

Never attempt to bypass CAPTCHA, OTP, 2FA, seller authentication, authorization checks, or restricted endpoints.

If browser automation is introduced, login challenges remain manual/legitimate and the limitation is documented.

## Abuse controls

For a public deployment, prevent anonymous unbounded scraping. Minimum may include auth plus reasonable request throttling/server safeguards.
