import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ResponseUtil } from "@coach/core";

/**
 * Runs a shared core schema (shape `{ params, query, body }`) against the request and replaces the request data with the parsed output,
 * so controllers can trust their input.
 *
 * `req.query` is a getter-only property in Express 5, so a plain assignment throws. Redefining the property is the only way to keep the parsed query.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- handlers declare their own typed Request generics, so this middleware must accept any of them
export function validateRequest(schema: ZodType): RequestHandler<any, any, any, any> {
	return (req, res, next) => {
		const input = { params: req.params ?? {}, query: req.query ?? {}, body: req.body ?? {} };
		const result = schema.safeParse(input);

		if (!result.success) {
			const errors = result.error.issues.map((issue) => ({
				field:
					issue.path
						.filter((segment) => segment !== "params" && segment !== "query" && segment !== "body")
						.join(".") || issue.path.join("."),
				message: issue.message,
			}));
			res.status(400).json(ResponseUtil.error(errors, "The request data is not valid"));
			return;
		}

		const parsed = result.data as { params?: unknown; query?: unknown; body?: unknown };
		if (parsed.params !== undefined) req.params = parsed.params as typeof req.params;
		if (parsed.body !== undefined) req.body = parsed.body;
		if (parsed.query !== undefined) {
			Object.defineProperty(req, "query", {
				value: parsed.query,
				writable: true,
				configurable: true,
				enumerable: true,
			});
		}

		next();
	};
}
