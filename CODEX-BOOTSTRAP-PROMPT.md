# First Codex Session Prompt

Use this prompt after copying the blueprint into the repository and merging `AGENTS-PROJECT-ADDENDUM.md` into the existing ECC `AGENTS.md`.

```text
Read the existing root AGENTS.md and preserve all ECC-owned instructions.
Then read:
- README-CODEX-BLUEPRINT.md
- docs/00-DOC-MAP.md
- docs/01-PROJECT-BRIEF.md
- docs/03-PRODUCT-REQUIREMENTS.md
- docs/04-SCOPE.md
- docs/07-ARCHITECTURE.md
- docs/24-IMPLEMENTATION-PLAN.md
- docs/25-ACCEPTANCE-CRITERIA.md

Do not implement features yet.

First inspect the current repository, package.json, existing Supabase files, shadcn setup, health endpoint, git status, and existing ECC files.

Return:
1. what is already implemented;
2. differences between the current repository and the documented target architecture;
3. any conflicts or ambiguities you found;
4. the smallest safe plan for Milestone 0 only;
5. files you expect to modify;
6. verification commands you will run.

Do not upgrade dependencies, overwrite ECC files, create database tables, or add new packages in this planning step.
```
