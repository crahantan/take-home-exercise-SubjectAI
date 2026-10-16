import { z } from "zod";
import { rawAttemptSchema, rawExportSchema } from "@coach/core";
import type { CleanAttempt, CleaningReport, RuleName, Skill, Student } from "@coach/core";

// Rule names, in the order the rules are applied.
const MALFORMED_ROW = "malformed_row" satisfies RuleName;
const UNKNOWN_SKILL = "unknown_skill" satisfies RuleName;
const UNKNOWN_STUDENT = "unknown_student" satisfies RuleName;
const DUPLICATE_ATTEMPT_ID = "duplicate_attempt_id" satisfies RuleName;
const MISSING_SECONDS = "missing_seconds" satisfies RuleName;
const EXTREME_SECONDS = "extreme_seconds" satisfies RuleName;
const AFTER_EXPORT = "after_export" satisfies RuleName;

// Judgment calls, not facts from the data: under 10 s a student can hardly have read and answered an item,
// and over 10 min they most likely left it open.
export const MIN_PLAUSIBLE_SECONDS = 10;
export const MAX_PLAUSIBLE_SECONDS = 600;

export interface CleanedExport {
	skills: Skill[];
	students: Student[];
	attempts: CleanAttempt[];
	report: CleaningReport;
}

// Plain code-unit order, so the result does not depend on the machine's locale.
const compareText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Pure: no I/O, no clock. Dropped rows are counted by the first rule that drops them only. */
export function cleanExport(raw: unknown): CleanedExport {
	const parsed = rawExportSchema.safeParse(raw);
	if (!parsed.success) {
		throw new Error(`The attempts export is not valid:\n${z.prettifyError(parsed.error)}`);
	}
	const { exported_at: exportedAt, skills, students, attempts: rawRows } = parsed.data;

	const exportedAtMs = Date.parse(exportedAt);
	if (Number.isNaN(exportedAtMs)) {
		throw new Error(`The attempts export is not valid: exported_at "${exportedAt}" is not a date`);
	}

	const rules: Record<RuleName, number> = {
		[MALFORMED_ROW]: 0,
		[UNKNOWN_SKILL]: 0,
		[UNKNOWN_STUDENT]: 0,
		[DUPLICATE_ATTEMPT_ID]: 0,
		[MISSING_SECONDS]: 0,
		[EXTREME_SECONDS]: 0,
		[AFTER_EXPORT]: 0,
	};
	const skillIds = new Set(skills.map((skill) => skill.skill_id));
	const studentIds = new Set(students.map((student) => student.student_id));
	// Only rows that survive the earlier rules are recorded, so a bad first row cannot hide a good later one.
	const seenAttemptIds = new Set<string>();
	const kept: { attempt: CleanAttempt; submittedAtMs: number }[] = [];

	for (const row of rawRows) {
		const result = rawAttemptSchema.safeParse(row);
		const submittedAtMs = result.success ? Date.parse(result.data.submitted_at) : NaN;
		if (!result.success || Number.isNaN(submittedAtMs)) {
			rules[MALFORMED_ROW]++;
			continue;
		}
		const attempt = result.data;

		if (!skillIds.has(attempt.skill_id)) {
			rules[UNKNOWN_SKILL]++;
			continue;
		}
		if (!studentIds.has(attempt.student_id)) {
			rules[UNKNOWN_STUDENT]++;
			continue;
		}
		if (seenAttemptIds.has(attempt.attempt_id)) {
			rules[DUPLICATE_ATTEMPT_ID]++;
			continue;
		}
		seenAttemptIds.add(attempt.attempt_id);

		// Unknown time is null, never zero. An implausible time is also set to null so no time feature uses it.
		let secondsSpent = attempt.seconds_spent;
		if (secondsSpent === null) {
			rules[MISSING_SECONDS]++;
		} else if (secondsSpent < MIN_PLAUSIBLE_SECONDS || secondsSpent > MAX_PLAUSIBLE_SECONDS) {
			rules[EXTREME_SECONDS]++;
			secondsSpent = null;
		}

		const afterExport = submittedAtMs > exportedAtMs;
		if (afterExport) rules[AFTER_EXPORT]++;

		kept.push({
			submittedAtMs,
			attempt: {
				attemptId: attempt.attempt_id,
				studentId: attempt.student_id,
				skillId: attempt.skill_id,
				itemId: attempt.item_id,
				isCorrect: attempt.is_correct,
				hintUsed: attempt.hint_used,
				secondsSpent,
				submittedAt: attempt.submitted_at,
				afterExport,
			},
		});
	}

	kept.sort(
		(a, b) =>
			a.submittedAtMs - b.submittedAtMs || compareText(a.attempt.attemptId, b.attempt.attemptId),
	);

	return {
		skills,
		students,
		attempts: kept.map(({ attempt }) => attempt),
		report: { rawCount: rawRows.length, cleanCount: kept.length, rules },
	};
}
