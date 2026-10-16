# 10. Make the recent tries and the totals read as one story

- Tool: Claude Code, run from the repo root with `CLAUDE.md` and `.claude/module-pattern.md` in place
- Date: 2026-10-16
- Purpose: looking at the screen on a phone-width window I saw "Your last 5 tries" with one right and four wrong, and right below it "Tries: 7 · Right: 2". The data is correct (Ana's first two tries on this skill include one right answer, and the window only shows the last five), but a 14-year-old reads it as a mismatch. This prompt changes only the copy and the order of that block.

## Prompt

```
Read CLAUDE.md first. Task: change the copy and the order of the "See how you did" block in apps/web/src/views/practice-page.ts, and nothing else. Do not run any git command that changes state. Do not touch docs/ or README.md. Do not change apps/api or packages/core. Add no dependency.

1. Inside the <details>, show the totals first, as one line: `In total: ${attempts} ${attempts === 1 ? "try" : "tries"}, ${correct} right, ${hints} with a hint.` Then the list of recent results with its own line before it: when evidence.recentResults.length is smaller than evidence.attempts, `Your last ${n} of ${attempts} tries, oldest first:`; when they are equal, `Your ${n} ${n === 1 ? "try" : "tries"}, oldest first:`. Keep the ✓ and ✗ items exactly as they are, with their aria-label. Remove the old "Tries: ... · Right: ... · Hints: ..." line.
2. Keep every dynamic string escaped and keep the page free of <script>.
3. In the existing views test block (do not add a new block), add one assertion that a fixture with 7 attempts and 5 recent results renders "Your last 5 of 7 tries" and "In total: 7 tries, 2 right", and one that a fixture with 3 attempts and 3 recent results renders "Your 3 tries, oldest first".
4. Verify: pnpm typecheck, lint, format:check and test pass. Start pnpm dev, curl GET / and show the text of the details block, and print the page size to confirm it is still under 14 KB.

Report the files you changed and every deviation from CLAUDE.md.
```

## Outcome and what I changed afterwards

Claude Code changed only the copy and the order of the details block: the totals come first ("In total: 7 tries, 2 right, 4 with a hint.") and the list says how many of the total it shows ("Your last 5 of 7 tries, oldest first:"). I checked the text for all three demo students against the data. The page stays at about 3.1 KB with no script tag, and typecheck, lint, format:check and test pass (api 9, web 2). The singular wording ("Your 1 try") is stiff but correct, and no student in the data reaches it.
