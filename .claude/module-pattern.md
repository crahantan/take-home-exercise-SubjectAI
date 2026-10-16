# Canonical module pattern

Adapted from the SWGAAF `financial-entities` module: same layers, same naming, same envelope. Everything the exercise forbids or does not need (authentication, permissions, Prisma, audits, soft delete, CSV import and export, the `system_logs` table) is removed. Messages are in English and relative imports have no `.js` extension.

## Differences from SWGAAF

- Routes chain only `validateRequest(schema)` and the controller. There is no `requireAuth` or `requirePermission`.
- There is no database. The service works on the cleaned attempts held in memory.
- Errors are written as one JSON line through `lib/logger.ts`, not to a table.
- The query DTO is typed through the fourth generic of `Request`. SWGAAF passes it in the params slot, which is not what that slot means.
- There is no control-character scan in `validateRequest`. The schemas are strict, and `student_id` is a closed pattern.
- `validateRequest` keeps the single allowed `any`, with a justified `eslint-disable` comment, because handlers declare their own typed `Request` generics.
- `notFoundHandler` (not in SWGAAF) answers unknown routes with the JSON envelope. `app.ts` mounts it after the routers and before `errorHandler`.
- The envelope exists twice in `core` on purpose. The `ApiResponse` interface and `ResponseUtil` type what the api controllers send. `apiResponseSchema(dataSchema)` is a zod discriminated union on `success`; the web client parses with it, so a bad response fails at runtime and narrows on `success`.
- Response shapes are zod schemas (`nextPracticeResponseSchema`) and the type comes from `z.infer`, like the request schemas.
- The files in this document are copied from the code. When the code changes, change this file in the same step.

## packages/core

`src/validators/common.ts`

```ts
import { z } from "zod";

/** Student ids in the export look like `stu_1041`. A closed pattern keeps arbitrary text out of the service. */
export const studentIdSchema = z
	.string()
	.trim()
	.regex(/^stu_\d+$/, { message: "student_id must look like stu_1041" });
```

`src/types/api/responses.ts`

```ts
import { z } from "zod";

/** Used by the api controllers to type what they send. */
export interface ApiResponse<T> {
	success: boolean;
	message?: string | undefined;
	data: T;
	error?: unknown | undefined;
}

/** Used by the web client to check a response at runtime. Parsing narrows the result on `success`. */
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.discriminatedUnion("success", [
		z.object({
			success: z.literal(true),
			message: z.string().optional(),
			data: dataSchema,
		}),
		z.object({
			success: z.literal(false),
			message: z.string().optional(),
			data: z.null(),
			error: z.unknown(),
		}),
	]);
```

`src/utils/api-helpers.ts`

```ts
import type { ApiResponse } from "../types/api/responses";

export const ResponseUtil = {
	success: <T>(data: T, message?: string): ApiResponse<T> => ({
		success: true,
		message,
		data,
	}),
	error: (error: unknown, message?: string): ApiResponse<null> => ({
		success: false,
		message,
		data: null,
		error,
	}),
};
```

`src/types/domain/next-practice.ts`

```ts
import { z } from "zod";
import { studentIdSchema } from "../../validators/common";

export const getNextPracticeSchema = z.object({
	params: z.object({}).strict(),
	query: z
		.object({
			student_id: studentIdSchema,
		})
		.strict(),
	body: z.object({}).strict(),
});

export const explanationSourceSchema = z.enum(["llm", "fallback"]);
export const fallbackReasonSchema = z.enum([
	"timeout",
	"provider_error",
	"invalid_output",
	"disabled",
]);

/** Placeholder shape. It is finalized once the open decisions in CLAUDE.md are settled. */
export const nextPracticeResponseSchema = z.object({
	studentId: z.string(),
	skillId: z.string(),
	skillName: z.string(),
	explanation: z.string(),
	source: explanationSourceSchema,
	fallbackReason: fallbackReasonSchema.nullable(),
});

export type GetNextPracticeDTO = z.infer<typeof getNextPracticeSchema>["query"];
export type ExplanationSource = z.infer<typeof explanationSourceSchema>;
export type FallbackReason = z.infer<typeof fallbackReasonSchema>;
export type NextPracticeResponse = z.infer<typeof nextPracticeResponseSchema>;
```

`src/index.ts` (barrel, single entry point)

```ts
export * from "./validators/common";
export * from "./types/api/responses";
export * from "./types/domain/next-practice";
export * from "./utils/api-helpers";
```

## apps/api

`src/lib/app-error.ts`

```ts
export class AppError extends Error {
	readonly statusCode: number;

	constructor(message: string, statusCode = 400) {
		super(message);
		this.name = "AppError";
		this.statusCode = statusCode;
	}
}
```

`src/lib/logger.ts`

```ts
type LogFields = Record<string, unknown>;

const write = (level: "info" | "error", fields: LogFields) => {
	console.log(JSON.stringify({ level, time: new Date().toISOString(), ...fields }));
};

export const logger = {
	info: (fields: LogFields) => write("info", fields),
	error: (fields: LogFields) => write("error", fields),
};
```

`src/middleware/validate-request.middleware.ts`

```ts
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
```

`src/middleware/error-handler.middleware.ts`

```ts
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
```

`src/middleware/index.ts`

```ts
export * from "./error-handler.middleware";
export * from "./validate-request.middleware";
```

`src/modules/next-practice/next-practice.routes.ts`

```ts
import { Router } from "express";
import { getNextPracticeSchema } from "@coach/core";
import { validateRequest } from "../../middleware";
import { getNextPractice } from "./next-practice.controllers";

const router: Router = Router();

router.get("/", validateRequest(getNextPracticeSchema), getNextPractice);

export default router;
```

`src/modules/next-practice/next-practice.controllers.ts`

```ts
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
```

`src/modules/next-practice/next-practice.services.ts` (stub until the domain logic exists)

```ts
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
```

`src/modules/next-practice/index.ts`

```ts
export * from "./next-practice.controllers";
export { default as nextPracticeRouter } from "./next-practice.routes";
```

`src/app.ts`

```ts
import express from "express";
import type { Application } from "express";
import { ResponseUtil } from "@coach/core";
import { errorHandler, notFoundHandler } from "./middleware";
import { logger } from "./lib/logger";
import { nextPracticeRouter } from "./modules/next-practice";

const app: Application = express();
const host = process.env.HOST || "localhost";
const port: number = parseInt(process.env.PORT || "3001", 10);
const baseAPI = process.env.BASE_API || "/api";

app.use(express.json({ limit: "10kb" }));

app.get(`${baseAPI}/health`, (_req, res) => {
	res.status(200).json(ResponseUtil.success({ status: "ok" }, "API online"));
});

app.use(`${baseAPI}/next-practice`, nextPracticeRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, host, () => {
	logger.info({ event: "api_started", url: `http://${host}:${port}${baseAPI}` });
});

export default app;
```

No CORS: the browser never calls this API. The web server calls it server to server, and the README says so.
