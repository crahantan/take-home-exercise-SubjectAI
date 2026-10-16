import { Router } from "express";
import { z } from "zod";
import { validateRequest } from "../../middleware";
import { getNextPracticeController } from "./next-practice.controllers";

const getNextPracticeSchema = z.object({
	params: z.object({}).strict(),
	query: z.object({}).strict(),
	body: z.object({}).strict(),
});

export const nextPracticeRouter = Router();

nextPracticeRouter.get(
	"/next-practice",
	validateRequest(getNextPracticeSchema),
	getNextPracticeController,
);
