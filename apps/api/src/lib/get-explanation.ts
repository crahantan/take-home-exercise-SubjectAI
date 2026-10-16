import type {
	ExplanationProvider,
	ExplanationSource,
	FallbackReason,
	Selection,
} from "@coach/core";
import { buildEvidenceSentence, buildFallbackMotivation, validateMotivation } from "./explanation";

export interface ExplanationResult {
	explanation: string;
	source: ExplanationSource;
	fallbackReason: FallbackReason | null;
	latencyMs: number;
	invalidRule: string | null;
}

interface GetExplanationParams {
	selection: Selection;
	/** Null means the model is switched off. Injected so tests can use a fake. */
	provider: ExplanationProvider | null;
	system: string;
	timeoutMs: number;
}

const isTimeoutError = (error: unknown): boolean =>
	typeof error === "object" && error !== null && "name" in error && error.name === "TimeoutError";

/**
 * Never throws. The evidence sentence is always the first part, so the numbers the student reads are
 * correct even when the model fails. Only the motivating sentence can come from the model.
 */
export async function getExplanation({
	selection,
	provider,
	system,
	timeoutMs,
}: GetExplanationParams): Promise<ExplanationResult> {
	const startedAt = performance.now();
	const evidenceSentence = buildEvidenceSentence(selection);

	const finish = (
		motivation: string,
		source: ExplanationSource,
		fallbackReason: FallbackReason | null,
		invalidRule: string | null = null,
	): ExplanationResult => ({
		explanation: `${evidenceSentence} ${motivation}`,
		source,
		fallbackReason,
		latencyMs: Math.round(performance.now() - startedAt),
		invalidRule,
	});
	const fallback = (reason: FallbackReason, invalidRule: string | null = null) =>
		finish(buildFallbackMotivation(selection.evidence), "fallback", reason, invalidRule);

	if (!provider) return fallback("disabled");

	// The model gets the skill name and whether data is thin, never numbers or the student's name.
	const user =
		`Skill to practice: ${selection.skillName}.` +
		(selection.evidence.thinEvidence ? " The student has tried it only a few times." : "");

	let raw: unknown;
	try {
		raw = await provider.generate({ system, user }, AbortSignal.timeout(timeoutMs));
	} catch (error) {
		return fallback(isTimeoutError(error) ? "timeout" : "provider_error");
	}

	const check = validateMotivation(raw);
	if (!check.ok) return fallback("invalid_output", check.rule);

	return finish(check.message, "llm", null);
}
