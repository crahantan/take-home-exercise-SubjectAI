import { ResponseUtil } from "@coach/core";
import type { RequestHandler } from "express";
import { getNextPractice } from "./next-practice.services";

export const getNextPracticeController: RequestHandler = async (_req, res, next) => {
	try {
		res.json(ResponseUtil.success(await getNextPractice()));
	} catch (error) {
		next(error);
	}
};
