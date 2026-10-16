# 05. Move cleaning to lib

- Tool: Claude Code, run from the repo root with `CLAUDE.md` and `.claude/module-pattern.md` in place
- Date: 2026-10-16
- Purpose: cleaning is a pure transformation of the export and does not belong to one endpoint, so I decided it lives in `apps/api/src/lib/` next to the logger and the LLM providers. Selection and explanation stay in the module for now.

## Prompt

```
Read CLAUDE.md first. Task: move the cleaning step to apps/api/src/lib/, and nothing else. Do not run any git command that changes state (use plain mv, not git mv). Do not touch docs/. Add no dependency.

1. Move apps/api/src/modules/next-practice/cleaning.ts and cleaning.test.ts to apps/api/src/lib/. Keep the code unchanged; only fix the relative imports (no .js extensions) and any import of cleaning elsewhere in the repo.
2. Update CLAUDE.md: in the Layout tree, list cleaning.ts and cleaning.test.ts under apps/api/src/lib/ and remove cleaning.ts from the next-practice module list. Keep selection.ts and explanation.ts where they are. Check the rest of CLAUDE.md for any other mention of the old path. Leave .claude/module-pattern.md as it is unless it mentions the old path.
3. Verify: pnpm typecheck, lint, format:check and test pass (3 of 3 tests), and grep -rn "next-practice/cleaning" . --include="*.ts" --include="*.md" --exclude-dir=node_modules --exclude-dir=docs finds nothing.

Report the files you moved or changed and every deviation from CLAUDE.md.
```

## Outcome and what I changed afterwards

Claude Code moved cleaning.ts and its test to apps/api/src/lib, fixed the imports and updated the layout in CLAUDE.md. Typecheck, lint, format:check and test still pass (3 of 3), and nothing in the repo refers to the old path.
