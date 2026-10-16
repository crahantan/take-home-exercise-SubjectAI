import { z } from "zod";
import { studentIdSchema } from "../../validators/common";

export const getNextPracticeSchema = z.object({
	params: z.object({}).strict(),
	query: z
		.object({
			student_id: studentIdSchema,
		})
		.strict(),
	body: z.object({}).strict(),
});

export const explanationSourceSchema = z.enum(["llm", "fallback"]);
export const fallbackReasonSchema = z.enum([
	"timeout",
	"provider_error",
	"invalid_output",
	"disabled",
]);

/** Five results are enough to show a trend without turning the evidence into a long list. */
export const RECENT_WINDOW = 5;

export const practiceEvidenceSchema = z.object({
	attempts: z.number().int(),
	correct: z.number().int(),
	hints: z.number().int(),
	/** Oldest first. */
	recentResults: z.array(z.boolean()).max(RECENT_WINDOW),
	daysSinceLastAttempt: z.number().int(),
	thinEvidence: z.boolean(),
});

export const nextPracticeResponseSchema = z.object({
	studentId: z.string(),
	firstName: z.string(),
	skillId: z.string(),
	skillName: z.string(),
	evidence: practiceEvidenceSchema,
	explanation: z.string(),
	source: explanationSourceSchema,
	fallbackReason: fallbackReasonSchema.nullable(),
});

export type GetNextPracticeDTO = z.infer<typeof getNextPracticeSchema>["query"];
export type ExplanationSource = z.infer<typeof explanationSourceSchema>;
export type FallbackReason = z.infer<typeof fallbackReasonSchema>;
export type NextPracticeResponse = z.infer<typeof nextPracticeResponseSchema>;
export type PracticeEvidence = z.infer<typeof practiceEvidenceSchema>;

export interface Selection {
	skillId: string;
	skillName: string;
	score: number;
	evidence: PracticeEvidence;
}
