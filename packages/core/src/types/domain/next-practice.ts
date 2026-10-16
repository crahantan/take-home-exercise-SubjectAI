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

/** Placeholder shape. It is finalized once the open decisions in CLAUDE.md are settled. */
export const nextPracticeResponseSchema = z.object({
	studentId: z.string(),
	skillId: z.string(),
	skillName: z.string(),
	explanation: z.string(),
	source: explanationSourceSchema,
	fallbackReason: fallbackReasonSchema.nullable(),
});

export type GetNextPracticeDTO = z.infer<typeof getNextPracticeSchema>["query"];
export type ExplanationSource = z.infer<typeof explanationSourceSchema>;
export type FallbackReason = z.infer<typeof fallbackReasonSchema>;
export type NextPracticeResponse = z.infer<typeof nextPracticeResponseSchema>;
