import type { NextFunction, Request, Response } from "express";
import type { ApiResponse, GetNextPracticeDTO, NextPracticeResponse } from "@coach/core";
import { ResponseUtil } from "@coach/core";
import { NextPracticeService } from "./next-practice.services";

const nextPracticeService = new NextPracticeService();

export const getNextPractice = async (
	req: Request<
		Record<string, never>,
		ApiResponse<NextPracticeResponse | null>,
		Record<string, never>,
		GetNextPracticeDTO
	>,
	res: Response<ApiResponse<NextPracticeResponse | null>>,
	next: NextFunction,
): Promise<void | Response<ApiResponse<NextPracticeResponse | null>>> => {
	try {
		const recommendation: NextPracticeResponse | null = await nextPracticeService.getNextPractice(
			req.query,
		);

		if (!recommendation) {
			return res.status(404).json(ResponseUtil.error(null, "Student not found"));
		}

		return res
			.status(200)
			.json(ResponseUtil.success(recommendation, "Next practice skill selected"));
	} catch (error) {
		next(error);
		return;
	}
};
