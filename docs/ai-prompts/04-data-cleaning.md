# 04. Data cleaning (pure function, named and counted rules)

- Tool: Claude Code, run from the repo root with `CLAUDE.md` and `.claude/module-pattern.md` in place
- Date: 2026-10-16
- Purpose: turn the raw export into clean attempts plus a `CleaningReport`. I inspected `attempts.json` myself first (123 rows, one repeated `attempt_id`, two null `seconds_spent`, one 4211 s outlier, two 6 s answers, three attempts dated after `exported_at`) and settled the rules below before writing this prompt. Selection is a separate prompt because its formula is still my decision.

## Prompt

```
Read CLAUDE.md and .claude/module-pattern.md first. Task: implement the data cleaning step and its tests, and nothing else. Do not run any git command that changes state. Do not touch docs/. Add no dependency; if vitest is not already installed, stop and ask me.

1. packages/core, types/domain/attempts.ts (export from the barrel):
   - rawExportSchema (zod): exported_at (ISO string), skills ([{ skill_id, name }]), students ([{ student_id, first_name }]) and attempts as an array of unknown. Rows are validated one by one in cleaning.ts so a single bad row does not reject the whole file.
   - rawAttemptSchema (zod): attempt_id, student_id, skill_id, item_id (strings), is_correct and hint_used (booleans), seconds_spent (number or null), submitted_at (ISO string).
   - Types from z.infer: RawAttempt, CleanAttempt and CleaningReport. CleanAttempt is { attemptId, studentId, skillId, itemId, isCorrect, hintUsed, secondsSpent: number | null, submittedAt: string, afterExport: boolean }. CleaningReport is { rawCount, cleanCount, rules: Record<RuleName, number> } where RuleName is a z.enum of the rule names below.

2. packages/database: keep loadRawExport(): unknown as it is.

3. apps/api/src/modules/next-practice/cleaning.ts, a pure function cleanExport(raw: unknown): { skills, students, attempts: CleanAttempt[], report: CleaningReport }. No I/O, no Date.now(), no logging. If raw does not match rawExportSchema, throw an Error with a clear message; the service will turn it into a 500 later. Rules, applied in this order, each one a named constant, counted in report.rules (a rule that never fires is reported as 0):
   - malformed_row: the row fails rawAttemptSchema, or submitted_at is not a valid date. The row is dropped.
   - unknown_skill and unknown_student: the id is not in the export's skills or students lists. The row is dropped.
   - duplicate_attempt_id: a second or later row with an attempt_id already seen. Keep the first, drop the rest. The same student seeing the same item_id on a different date is a legitimate retry and is NOT a duplicate.
   - missing_seconds: seconds_spent is null. The attempt is KEPT, with secondsSpent null (unknown, never zero).
   - extreme_seconds: seconds_spent below MIN_PLAUSIBLE_SECONDS = 10 or above MAX_PLAUSIBLE_SECONDS = 600. The attempt is KEPT for correctness and hints, and secondsSpent is set to null so no time feature ever uses it. Export both constants with a one-line comment on why those values.
   - after_export: submitted_at is later than exported_at. The attempt is KEPT and marked afterExport: true. Do not drop it and do not change the date.
   The output is sorted by submittedAt ascending, ties broken by attemptId, so results are deterministic. Rows dropped by one rule are not counted again by a later rule.

4. apps/api/src/modules/next-practice/cleaning.test.ts with exactly three vitest tests, using small inline fixtures and not the real file:
   - drops a repeated attempt_id but keeps the same item_id on a different date;
   - keeps null and extreme seconds attempts with secondsSpent null, and counts them;
   - drops malformed rows and unknown ids without throwing, and flags after_export without dropping.

5. Do NOT wire this into the service or the controller yet. The service stays a stub.

6. Verify: run pnpm typecheck, lint, format:check and test. Then run a throwaway tsx command (do not commit it) that calls loadRawExport and cleanExport on the real file and prints the report. I expect: rawCount 123, cleanCount 122, duplicate_attempt_id 1, missing_seconds 2, extreme_seconds 3, after_export 3, and 0 for the other rules. If your numbers differ, show me the rows instead of changing the rules.

Report the files you created or changed, the printed report, and every deviation from CLAUDE.md or the pattern.
```

## Outcome and what I changed afterwards

Claude Code implemented cleanExport and its three tests. On the real file the report matched my hand count exactly: 123 raw rows, 122 clean, one duplicate, two missing seconds, three extreme seconds and three attempts after exported_at (att_5042, att_5055, att_5089). vitest was not installed, so it stopped and asked; I approved adding it as a devDependency of apps/api. I accepted its small choices: an attempt_id only counts as seen if its row survived the earlier rules, timestamps must use the Z form, and ties in the sort are broken by plain string order. Afterwards I decided cleaning belongs in lib/, which became prompt 05.
