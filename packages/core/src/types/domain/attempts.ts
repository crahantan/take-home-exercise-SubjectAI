import { z } from "zod";

export const skillSchema = z.object({
	skill_id: z.string(),
	name: z.string(),
});

export const studentSchema = z.object({
	student_id: z.string(),
	first_name: z.string(),
});

/** Attempts stay `unknown` here: cleaning validates them one by one, so one bad row does not reject the file. */
export const rawExportSchema = z.object({
	exported_at: z.iso.datetime(),
	skills: z.array(skillSchema),
	students: z.array(studentSchema),
	attempts: z.array(z.unknown()),
});

export const rawAttemptSchema = z.object({
	attempt_id: z.string(),
	student_id: z.string(),
	skill_id: z.string(),
	item_id: z.string(),
	is_correct: z.boolean(),
	hint_used: z.boolean(),
	seconds_spent: z.number().nullable(),
	submitted_at: z.iso.datetime(),
});

export const ruleNameSchema = z.enum([
	"malformed_row",
	"unknown_skill",
	"unknown_student",
	"duplicate_attempt_id",
	"missing_seconds",
	"extreme_seconds",
	"after_export",
]);

export const cleanAttemptSchema = z.object({
	attemptId: z.string(),
	studentId: z.string(),
	skillId: z.string(),
	itemId: z.string(),
	isCorrect: z.boolean(),
	hintUsed: z.boolean(),
	secondsSpent: z.number().nullable(),
	submittedAt: z.string(),
	afterExport: z.boolean(),
});

export const cleaningReportSchema = z.object({
	rawCount: z.number().int(),
	cleanCount: z.number().int(),
	rules: z.record(ruleNameSchema, z.number().int()),
});

export type Skill = z.infer<typeof skillSchema>;
export type Student = z.infer<typeof studentSchema>;
export type RawAttempt = z.infer<typeof rawAttemptSchema>;
export type RuleName = z.infer<typeof ruleNameSchema>;
export type CleanAttempt = z.infer<typeof cleanAttemptSchema>;
export type CleaningReport = z.infer<typeof cleaningReportSchema>;
