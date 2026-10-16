import type { GetNextPracticeDTO, NextPracticeResponse } from "@coach/core";
import { AppError } from "../../lib/app-error";

export class NextPracticeService {
	/**
	 * Target flow: take the cleaned attempts, select the skill, build the explanation (provider, validation, fallback), log one line.
	 * Returns null when the student does not exist; the controller turns that into a 404.
	 */
	async getNextPractice(_data: GetNextPracticeDTO): Promise<NextPracticeResponse | null> {
		throw new AppError("Not implemented yet", 501);
	}
}
