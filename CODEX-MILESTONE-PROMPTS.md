# Codex Milestone Prompt Templates

Use one milestone at a time. Never ask Codex to “build the whole app.”

## Generic implementation prompt

```text
Implement only Milestone <N> from docs/24-IMPLEMENTATION-PLAN.md.

Before editing:
- read root AGENTS.md;
- read docs/00-DOC-MAP.md;
- read only the project docs referenced by this milestone;
- inspect the existing implementation and tests.

Follow the documented architecture and anti-AI-slop design rules.
Do not implement later milestones.
Do not install dependencies unless the milestone explicitly requires one and no existing package can solve it.

At the end:
- run the milestone-specific tests;
- run npm run lint;
- run npm run build if the changed surface can affect production build;
- summarize the diff, test evidence, remaining risks, and any documentation updates.
```

## Review prompt

```text
Review the changes for the current milestone from a fresh context.
Focus on:
- requirement coverage;
- correctness and edge cases;
- security, SSRF, secret handling, RLS boundaries;
- scraper brittleness;
- data loss/mapping mistakes;
- non-technical usability;
- AI-slop UI patterns;
- missing tests;
- unnecessary dependencies or abstractions.

Do not rewrite code unless I ask after the review. Rank findings by severity and cite exact files/functions.
```

## Build-fix prompt

```text
Fix only the reported lint/build/test failure. Reproduce it first, identify root cause, make the smallest correction, and rerun the failing check. Do not opportunistically refactor unrelated code.
```
