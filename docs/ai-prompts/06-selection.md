# 06. Skill selection (pure, deterministic, explainable)

- Tool: Claude Code, run from the repo root with `CLAUDE.md` and `.claude/module-pattern.md` in place
- Date: 2026-10-16
- Purpose: choose the skill a student should practice next from the clean attempts, and return the evidence behind the choice. I decided the formula myself before writing this prompt: the lowest smoothed accuracy wins, where smoothing adds one imaginary correct and one imaginary wrong answer so a skill with very few attempts is neither ignored nor chosen by chance. Hints and recency are shown as evidence and do not change the choice.

## Prompt

```
Read CLAUDE.md and .claude/module-pattern.md first. Task: implement the skill selection step and its tests, and nothing else. Do not run any git command that changes state. Do not touch docs/. Add no dependency.

1. packages/core, types/domain/next-practice.ts (export from the barrel): add practiceEvidenceSchema (zod) with attempts (int), correct (int), hints (int), recentResults (array of booleans, oldest first, at most RECENT_WINDOW items), daysSinceLastAttempt (int) and thinEvidence (boolean). Add the type PracticeEvidence from z.infer, and the type Selection = { skillId: string; skillName: string; score: number; evidence: PracticeEvidence }. Do NOT change nextPracticeResponseSchema yet; the explanation design is still an open decision.

2. apps/api/src/modules/next-practice/selection.ts, a pure function selectNextSkill(attempts: CleanAttempt[], skills: { skill_id: string; name: string }[], studentId: string): Selection | null. No I/O, no Date.now(), no logging. Use the skills shape that cleanExport already returns.
   - Only the attempts of studentId are used. Only skills the student has at least one attempt in are candidates; never invent data for a skill with zero attempts.
   - score = (correct + SMOOTHING_CORRECT) / (attempts + SMOOTHING_CORRECT + SMOOTHING_WRONG), with SMOOTHING_CORRECT = 1 and SMOOTHING_WRONG = 1. The lowest score wins.
   - Ties are broken by more attempts first (more reliable), then by skillId in plain string order, so the result is deterministic.
   - evidence.attempts, correct and hints count the student's clean attempts on the chosen skill (hints = attempts with hintUsed true). recentResults holds the isCorrect values of the last RECENT_WINDOW = 5 attempts, oldest first. daysSinceLastAttempt is the whole days between the student's last attempt on that skill and the student's latest attempt on ANY skill, never the wall clock, so the output does not change with the day it runs. thinEvidence is true when attempts < THIN_EVIDENCE_ATTEMPTS = 3.
   - Attempts flagged afterExport are used like any other attempt.
   - Return null when the student has no attempts. The service decides what to do with that later.
   - Export SMOOTHING_CORRECT, SMOOTHING_WRONG, RECENT_WINDOW (put it in core so the schema can use it) and THIN_EVIDENCE_ATTEMPTS, each with a one-line comment on why that value.

3. apps/api/src/modules/next-practice/selection.test.ts with exactly three vitest tests and small inline fixtures, not the real file:
   - picks the skill with the lowest smoothed score and fills the evidence correctly (counts, recentResults order and the window cap, daysSinceLastAttempt);
   - a skill with a single correct attempt does not win over a weak, well-observed skill, and a chosen skill with fewer than 3 attempts has thinEvidence true;
   - breaks a tie by more attempts and then by skillId, and returns null for a student with no attempts.

4. Do NOT wire this into the service or the controller yet. The service stays a stub.

5. Verify: run pnpm typecheck, lint, format:check and test. Then run a throwaway tsx command (do not commit it) that calls loadRawExport, cleanExport and selectNextSkill for stu_1041, stu_2277 and stu_3390 and prints each Selection. I expect: stu_1041 lin_eq_1 (7 attempts, 2 correct, 4 hints, score 0.3333), stu_2277 word_prob (5 attempts, 0 correct, 2 hints, score 0.1429), stu_3390 ratio_basic (7 attempts, 3 correct, 3 hints, score 0.4444). If your numbers differ, show me the rows instead of changing the formula.

Report the files you created or changed, the printed selections, and every deviation from CLAUDE.md or the pattern.
```

## Outcome and what I changed afterwards

Claude Code implemented selectNextSkill and its three tests. On the real file the three selections matched my hand calculation exactly: lin_eq_1 for stu_1041 (score 0.3333), word_prob for stu_2277 (0.1429) and ratio_basic for stu_3390 (0.4444), none with thin evidence. I accepted its choices: attempts must arrive oldest first, as cleanExport returns them, and the function does not re-sort; ties compare as plain numbers and are broken by more attempts and then by skill id; SMOOTHING_CORRECT, SMOOTHING_WRONG and THIN_EVIDENCE_ATTEMPTS live in selection.ts while RECENT_WINDOW lives in core. The service and the response schema are untouched until I decide the explanation design.
