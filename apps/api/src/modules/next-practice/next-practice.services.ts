import { loadRawExport } from "@coach/database";
import type { ExplanationProvider, GetNextPracticeDTO, NextPracticeResponse } from "@coach/core";
import { AppError } from "../../lib/app-error";
import { cleanExport } from "../../lib/cleaning";
import type { CleanedExport } from "../../lib/cleaning";
import { getExplanation } from "../../lib/get-explanation";
import { createProvider, getLlmTimeoutMs, loadPrompt } from "../../lib/llm";
import { logger } from "../../lib/logger";
import { selectNextSkill } from "../../lib/selection";

export class NextPracticeService {
	private readonly data: CleanedExport;
	private readonly provider: ExplanationProvider | null;
	private readonly prompt: { version: string; text: string };
	private readonly timeoutMs: number;

	// The export is read and cleaned once; a bad file or bad config stops the api at startup.
	constructor() {
		this.data = cleanExport(loadRawExport());
		this.provider = createProvider();
		this.prompt = loadPrompt();
		this.timeoutMs = getLlmTimeoutMs();

		logger.info({ event: "export_cleaned", report: this.data.report });
	}

	/**
	 * Orchestrates the lib functions. Returns null when the student does not exist; the controller turns that into a 404.
	 */
	async getNextPractice(data: GetNextPracticeDTO): Promise<NextPracticeResponse | null> {
		const { skills, students, attempts } = this.data;

		const student = students.find((candidate) => candidate.student_id === data.student_id);
		if (!student) return null;

		const selection = selectNextSkill(attempts, skills, student.student_id);
		if (!selection) throw new AppError("No attempts found for this student", 404);

		const result = await getExplanation({
			selection,
			provider: this.provider,
			system: this.prompt.text,
			timeoutMs: this.timeoutMs,
		});

		logger.info({
			event: "next_practice_explained",
			studentId: student.student_id,
			skillId: selection.skillId,
			provider: this.provider?.name ?? "none",
			model: this.provider?.model ?? null,
			promptVersion: this.prompt.version,
			latencyMs: result.latencyMs,
			source: result.source,
			fallbackReason: result.fallbackReason,
			invalidRule: result.invalidRule,
			thinEvidence: selection.evidence.thinEvidence,
		});

		return {
			studentId: student.student_id,
			firstName: student.first_name,
			skillId: selection.skillId,
			skillName: selection.skillName,
			evidence: selection.evidence,
			explanation: result.explanation,
			source: result.source,
			fallbackReason: result.fallbackReason,
		};
	}
}
