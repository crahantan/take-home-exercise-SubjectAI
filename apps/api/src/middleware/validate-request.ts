import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../lib/app-error";

// Validates only. Express 5 makes req.query read-only, so controllers read from req as usual.
export const validateRequest =
	(schema: ZodType): RequestHandler =>
	(req, _res, next) => {
		const result = schema.safeParse({
			params: req.params,
			query: req.query,
			body: req.body ?? {},
		});
		if (!result.success) {
			next(new AppError(400, "VALIDATION_ERROR", "Invalid request", result.error.issues));
			return;
		}
		next();
	};
