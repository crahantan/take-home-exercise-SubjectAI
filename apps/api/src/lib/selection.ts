import { RECENT_WINDOW } from "@coach/core";
import type { CleanAttempt, Selection, Skill } from "@coach/core";

// One imaginary correct and one imaginary wrong answer: a skill with one or two attempts is
// pulled toward 50%, so it is neither ignored nor chosen by chance.
export const SMOOTHING_CORRECT = 1;
export const SMOOTHING_WRONG = 1;

// With fewer attempts than this the choice is weakly supported, and the explanation must say so.
export const THIN_EVIDENCE_ATTEMPTS = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Pure: no I/O, no clock. `attempts` must be oldest first, as `cleanExport` returns them.
 * Picks the skill with the lowest smoothed accuracy among the skills the student has tried.
 * Hints and recency are evidence only; they do not change the choice.
 */
export function selectNextSkill(
	attempts: CleanAttempt[],
	skills: Skill[],
	studentId: string,
): Selection | null {
	const own = attempts.filter((attempt) => attempt.studentId === studentId);
	const latest = own.at(-1);
	if (!latest) return null;
	const latestMs = Date.parse(latest.submittedAt);

	const candidates = skills.flatMap((skill) => {
		const onSkill = own.filter((attempt) => attempt.skillId === skill.skill_id);
		const last = onSkill.at(-1);
		if (!last) return [];
		const correct = onSkill.filter((attempt) => attempt.isCorrect).length;
		const score =
			(correct + SMOOTHING_CORRECT) / (onSkill.length + SMOOTHING_CORRECT + SMOOTHING_WRONG);
		return [{ skill, onSkill, last, correct, score }];
	});

	// Equal fractions give the same double, so ties compare equal. Skill ids are unique.
	candidates.sort(
		(a, b) =>
			a.score - b.score ||
			b.onSkill.length - a.onSkill.length ||
			(a.skill.skill_id < b.skill.skill_id ? -1 : 1),
	);
	const best = candidates[0];
	if (!best) return null;

	return {
		skillId: best.skill.skill_id,
		skillName: best.skill.name,
		score: best.score,
		evidence: {
			attempts: best.onSkill.length,
			correct: best.correct,
			hints: best.onSkill.filter((attempt) => attempt.hintUsed).length,
			recentResults: best.onSkill.slice(-RECENT_WINDOW).map((attempt) => attempt.isCorrect),
			// Measured against the student's own latest attempt, never the wall clock.
			daysSinceLastAttempt: Math.floor((latestMs - Date.parse(best.last.submittedAt)) / MS_PER_DAY),
			thinEvidence: best.onSkill.length < THIN_EVIDENCE_ATTEMPTS,
		},
	};
}
