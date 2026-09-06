# Authentication & Security

## Authentication

CatalogBridge uses Supabase email/password Auth. Public visitors may view `/`,
sign in at `/login`, or create an account at `/register`. All application data
routes remain authenticated. An authenticated visit to `/` redirects to
`/dashboard` without a client-side auth flash.

Registration requests only email, password, and password confirmation. It does
not write profile metadata or accept an owner identifier. If Supabase returns a
session, the account continues to Dashboard. If Supabase creates the user but
requires email confirmation, the UI asks the user to confirm and then sign in.
Provider errors are mapped to stable public messages; raw errors are never
rendered.

The Supabase email provider and new-user signup must be enabled deliberately in
the intended hosted project. Its Site URL and allowed redirect URLs must use the
deployed CatalogBridge origin before confirmation email is enabled. The latest
local M8 QA observed the safe `registration unavailable` result because signup
was disabled, so a fresh second-account isolation check remains required after
configuration is enabled. Do not weaken RLS, introduce a service-role client,
or add application roles to make registration work.

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
- product ownership is derived from `auth.uid()` and enforced by grants plus RLS;
- registration never accepts caller-controlled `owner_id`;
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

Public self-registration makes authentication alone an insufficient abuse
boundary for the live JakMall fetch action. This bounded M8 slice deliberately
does not add CAPTCHA or a throttle. Before enabling open production signup,
choose and verify a proportionate provider control plus durable per-user or
per-origin import limits; keep the assisted single-product workflow and source
rate limits intact.
