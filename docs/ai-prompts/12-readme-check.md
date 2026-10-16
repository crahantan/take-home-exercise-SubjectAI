# 12. Check the README against the repository (read-only)

- Tool: Claude Code, run from the repo root with `CLAUDE.md` in place
- Date: 2026-10-16
- Purpose: the README was written from my notes and from the reports of earlier prompts, not from the code. Before I commit it, every checkable claim must be compared with the repository. This prompt only reports differences; I decide what to change.

## Prompt

```
Read CLAUDE.md first. Task: read-only verification of README.md against the repository. Do not edit any file, do not run any git command that changes state, do not touch docs/. Do not start any server except where a step below says so.

Go through README.md and check every claim that can be checked, then report a table with three columns: the claim (quote a few words), what the repository actually says, and OK or DIFFERENT. Check at least:
1. The commands and the variables in section 1: the scripts in the root package.json, the variable names and defaults in .env.example and in the code that reads them (apps/api, apps/web lib/config.ts, llm/index.ts), the default ports (api 3001, web 3000) and how PORT works for each app.
2. The example response in section 1: run the api once with LLM_PROVIDER=none and compare the JSON field names and nesting with the README example (the values may differ; report only structure and names).
3. The file tree in section 2: every path listed exists, and nothing important in apps/ or packages/ is missing from it.
4. The numbers in sections 3 and 7: recompute the selection score, attempts, correct and hints of the three students and the CleaningReport counts, and check the row ids named in the cleaning table, directly from packages/database/data/attempts.json with a throwaway script (do not commit it; delete it afterwards).
5. Section 4: the validation rules and their constants (MAX_MOTIVATION_CHARS, the praise words), the fallbackReason values, the timeout defaults and the fields of the log line.
6. Section 5: the size of the practice page and of the fallback page (curl with the api running and stopped) and the size of the inline CSS.
7. The test count (the README says 11: 9 in apps/api and 2 in apps/web) from the real pnpm test output, and what each test covers.
8. The branch names and the docs/ai-prompts file numbers mentioned in section 10 (the prompts are numbered 01- to 11- by now, plus this one).
9. Section 1: the clone-and-run steps work from a fresh clone (check that package.json pins the pnpm version through packageManager, so corepack enable is enough), and section 5: the Start practicing button and its in-page note exist as described.

Do not fix anything. End with a short list of the differences that I should correct in the README, ordered by how misleading they are.
```

## Outcome and what I changed afterwards

Claude Code compared the README with the repository and changed nothing. Most claims matched, including every selection score, cleaning count and row id, the variables and the log fields. It found eight differences: the Node version (pnpm 11 needs Node 22.13 or newer, not 20), the Corepack instructions (Node 25 and later do not bundle it), the shared PORT warning, the page and CSS sizes, the loose wording about the smoothed score, the branch target (merges went into develop, not main), and a few files missing from the tree. I corrected the README for each one, and I still have to fix the engines field in package.json and merge develop into main myself.