# Release Checklist

Run this after `23-PRODUCTION.md` is substantially satisfied.

## Code

- [ ] review git diff
- [ ] remove dead/debug code
- [ ] no commented-out large blocks
- [ ] no unexplained `any`
- [ ] no new dependency without justification
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] relevant tests

## Security

- [ ] `git status` contains no `.env.local`
- [ ] search tracked files for secret-looking values
- [ ] RLS/server paths reviewed
- [ ] invalid/private URLs rejected
- [ ] no authorization bypass
- [ ] ECC/AgentShield security scan if available

## UI

- [ ] no fake data represented as live data
- [ ] no lorem ipsum
- [ ] no dead nav item
- [ ] loading/empty/error states
- [ ] primary mobile widths checked
- [ ] keyboard/focus smoke test
- [ ] anti-AI-slop visual audit

## Demo

- [ ] known-good JakMall URL prepared
- [ ] second product/variant case prepared
- [ ] known failure case prepared
- [ ] Shopee handoff path verified
- [ ] demo credentials available securely
- [ ] public URL tested in incognito
- [ ] demo under five minutes rehearsed
