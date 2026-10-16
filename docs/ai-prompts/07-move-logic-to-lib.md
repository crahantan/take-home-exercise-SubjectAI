# 07. All business logic lives in lib

- Tool: Claude Code, run from the repo root with `CLAUDE.md` and `.claude/module-pattern.md` in place
- Date: 2026-10-16
- Purpose: after moving cleaning to `apps/api/src/lib/` I decided the rule is general: every pure piece of business logic (cleaning, selection, and later explanation validation and fallback templates) lives in `lib/`, and the module only holds routes, controllers and a service that orchestrates. This prompt moves selection and writes the rule into `CLAUDE.md` so later prompts follow it.

## Prompt

```
Read CLAUDE.md first. Task: move selection to apps/api/src/lib/ and record the rule that all business logic lives there, and nothing else. Do not run any git command that changes state (use plain mv, not git mv). Do not touch docs/. Add no dependency.

1. Move apps/api/src/modules/next-practice/selection.ts and selection.test.ts to apps/api/src/lib/. Keep the code unchanged; only fix relative imports (no .js extensions) and any import of selection elsewhere in the repo.
2. Update CLAUDE.md:
   - Layout tree: list selection.ts and selection.test.ts under apps/api/src/lib/, and plan explanation.ts (pure: validation of model output and fallback templates) under lib/ as well, removing selection.ts and explanation.ts from the next-practice module list. The module keeps routes, controllers, services and index, plus its *.test.ts entry only if a test still lives there; if none does, remove that entry.
   - Conventions: add one line saying that all business logic (cleaning, selection, explanation validation and fallback templates) lives as pure functions in apps/api/src/lib/, and that the module's service only orchestrates them and contains no HTTP.
   - Check the rest of CLAUDE.md, including Product rules and Open decisions, for any other mention of the old paths.
   Leave .claude/module-pattern.md as it is unless it mentions the old paths.
3. Verify: pnpm typecheck, lint, format:check and test pass (6 of 6), and grep -rn "next-practice/selection" . --include="*.ts" --include="*.md" --exclude-dir=node_modules --exclude-dir=docs finds nothing.

Report the files you moved or changed and every deviation from CLAUDE.md.
```

## Outcome and what I changed afterwards

Claude Code moved selection.ts and its test to apps/api/src/lib, updated the layout in CLAUDE.md, planned explanation.ts under lib as well and added the rule that all business logic lives there as pure functions. Typecheck, lint, format:check and test still pass (6 of 6), and nothing refers to the old paths.
