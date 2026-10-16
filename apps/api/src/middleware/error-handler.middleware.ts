import type { ErrorRequestHandler, RequestHandler } from "express";
import { ResponseUtil } from "@coach/core";
import { AppError } from "../lib/app-error";
import { logger } from "../lib/logger";

const GENERIC_ERROR_MESSAGE = "Something went wrong on our side. Please try again.";

/** body-parser (express.json) failures carry `type: "entity.*"`; they are the client's fault, not a server crash. */
function getBodyParserError(err: unknown): { statusCode: number; message: string } | null {
	if (
		!err ||
		typeof err !== "object" ||
		!("type" in err) ||
		typeof err.type !== "string" ||
		!err.type.startsWith("entity.")
	)
		return null;
	if (err.type === "entity.too.large")
		return { statusCode: 413, message: "The request body is too large" };
	if (err.type === "entity.parse.failed")
		return { statusCode: 400, message: "The request body is not valid JSON" };
	return { statusCode: 400, message: "The request body could not be read" };
}

/** Answers unknown routes with the JSON envelope. Mounted after the routers and before `errorHandler`. */
export const notFoundHandler: RequestHandler = (_req, res) => {
	res.status(404).json(ResponseUtil.error(null, "Route not found"));
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	const appError = err instanceof AppError ? err : null;
	const bodyParserError = appError ? null : getBodyParserError(err);
	const statusCode = appError?.statusCode ?? bodyParserError?.statusCode ?? 500;
	const clientMessage = appError?.message ?? bodyParserError?.message ?? GENERIC_ERROR_MESSAGE;

	// The real error goes to the log only; the client never sees it.
	logger.error({
		event: "request_error",
		message: err instanceof Error ? err.message : "Unknown error",
		stack: err instanceof Error ? err.stack : undefined,
		endpoint: req.originalUrl,
		method: req.method,
		statusCode,
	});

	res.status(statusCode).json(ResponseUtil.error(null, clientMessage));
};
