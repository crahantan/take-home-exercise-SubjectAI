import { modelOutputSchema } from "@coach/core";
import type { PracticeEvidence, Selection } from "@coach/core";

// A motivating sentence is short. Longer text is the model rambling or ignoring the prompt.
export const MAX_MOTIVATION_CHARS = 100;

// Every number the student reads comes from the evidence sentence, so the model sentence has no digits.
export const SENTENCE_END_CHARS = [".", "!", "?"];

// Characters and fragments that mean markup or a link. Plain text is the only thing the page may show.
export const MARKUP_CHARS = ["<", ">", "{", "}", "[", "]", "`"];
export const LINK_FRAGMENTS = ["http", "www.", "://"];

// The chosen skill is the student's weakest by definition, so praise about it is never supported by the data.
export const PRAISE_WORDS = [
	"great",
	"amazing",
	"awesome",
	"excellent",
	"fantastic",
	"brilliant",
	"perfect",
	"well done",
	"good job",
	"nailed",
	"crushed",
	"mastered",
	"genius",
	"smart",
	"proud",
];

export type MotivationCheck = { ok: true; message: string } | { ok: false; rule: string };

/** Every number comes from the evidence, never from the model. */
export function buildEvidenceSentence(selection: Selection): string {
	const { skillName, evidence } = selection;
	const { attempts, correct, hints, thinEvidence } = evidence;

	if (thinEvidence) {
		return `You have only tried ${skillName} ${attempts} ${attempts === 1 ? "time" : "times"} so far, so this is an early look.`;
	}

	const hintPart = hints > 0 ? `, and you used a hint on ${hints} of them` : "";
	return `You got ${correct} of ${attempts} tries right on ${skillName}${hintPart}.`;
}

/** Fixed text with no numbers and no praise, so it is always safe to show. */
export function buildFallbackMotivation(evidence: PracticeEvidence): string {
	return evidence.thinEvidence
		? "A few more tries will show how this skill is really going."
		: "A short round on this one is a good next step.";
}

/** Never throws. Returns the first rule that fails, so the log can say why the model was not used. */
export function validateMotivation(raw: unknown): MotivationCheck {
	const parsed = modelOutputSchema.safeParse(raw);
	if (!parsed.success) return { ok: false, rule: "shape" };

	const message = parsed.data.message.trim();

	if (message.length === 0 || message.length > MAX_MOTIVATION_CHARS) {
		return { ok: false, rule: "length" };
	}

	const endMarks = [...message].filter((char) => SENTENCE_END_CHARS.includes(char)).length;
	const lastChar = message.at(-1) ?? "";
	if (endMarks !== 1 || !SENTENCE_END_CHARS.includes(lastChar)) {
		return { ok: false, rule: "sentence_count" };
	}

	if (/\d/.test(message)) return { ok: false, rule: "digits" };

	const lower = message.toLowerCase();
	if (
		MARKUP_CHARS.some((char) => lower.includes(char)) ||
		LINK_FRAGMENTS.some((fragment) => lower.includes(fragment))
	) {
		return { ok: false, rule: "markup" };
	}

	// Substring match on purpose: blocking "greater" by mistake costs a fallback, missing praise costs trust.
	if (PRAISE_WORDS.some((word) => lower.includes(word))) return { ok: false, rule: "praise" };

	return { ok: true, message };
}
