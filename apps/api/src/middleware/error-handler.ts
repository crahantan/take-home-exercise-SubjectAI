import { ResponseUtil } from "@coach/core";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../lib/app-error";
import { logger } from "../lib/logger";

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
	next(new AppError(404, "NOT_FOUND", "Route not found"));
};

// Express 5 recognizes error handlers by their four parameters.
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
	if (error instanceof AppError) {
		res
			.status(error.statusCode)
			.json(ResponseUtil.error(error.message, { code: error.code, details: error.details }));
		return;
	}

	// express.json() rejects malformed bodies with a SyntaxError that carries status 400.
	if (error instanceof SyntaxError && "status" in error && error.status === 400) {
		res.status(400).json(ResponseUtil.error("Malformed JSON body", { code: "INVALID_JSON" }));
		return;
	}

	logger.error("unhandled error", {
		error: error instanceof Error ? (error.stack ?? error.message) : String(error),
	});
	res
		.status(500)
		.json(ResponseUtil.error("Something went wrong", { code: "INTERNAL_SERVER_ERROR" }));
};
