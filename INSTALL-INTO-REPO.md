# Install This Blueprint Into the Existing Repository

Assuming the ZIP is extracted somewhere outside the project:

## Copy

Copy these folders/files into the repository root:

- `docs/`
- `design/`
- `README-CODEX-BLUEPRINT.md`
- `CODEX-BOOTSTRAP-PROMPT.md`
- `CODEX-MILESTONE-PROMPTS.md`

## Do not overwrite

Do **not** replace existing:

- `AGENTS.md`
- `CLAUDE.md`
- `.codex/`
- `.agents/`
- ECC hooks/rules/skills.

## Merge AGENTS project section

Either manually append `AGENTS-PROJECT-ADDENDUM.md` to the existing root `AGENTS.md`, or ask Codex:

```text
Conservatively merge AGENTS-PROJECT-ADDENDUM.md into the existing root AGENTS.md.
Preserve all existing ECC instructions and ordering as much as possible.
Add a clearly marked “CatalogBridge Project Addendum” section rather than replacing ECC content.
Show me the diff before making unrelated changes.
```

## Verify

After copying/merging:

```bash
git status
npm run lint
npm run build
```

Then start the first Codex session using `CODEX-BOOTSTRAP-PROMPT.md`.
