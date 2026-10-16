import { apiResponseSchema, nextPracticeResponseSchema } from "@coach/core";
import type { NextPracticeResponse } from "@coach/core";

export type UnavailableReason = "timeout" | "network" | "api_error" | "invalid_response";

export type NextPracticeResult =
	| { kind: "ok"; data: NextPracticeResponse; latencyMs: number }
	| { kind: "unavailable"; reason: UnavailableReason; latencyMs: number };

/** The part of `fetch` this client uses, so tests can pass a fake. */
export type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>;

interface ClientOptions {
	/** Base of the api routes, for example http://localhost:3001/api */
	apiUrl: string;
	timeoutMs: number;
	fetchImpl?: FetchImpl;
}

const responseSchema = apiResponseSchema(nextPracticeResponseSchema);

const isTimeoutError = (error: unknown): boolean =>
	typeof error === "object" && error !== null && "name" in error && error.name === "TimeoutError";

/** The only code that calls the api. It never throws: every failure becomes an `unavailable` result. */
export async function fetchNextPractice(
	studentId: string,
	{ apiUrl, timeoutMs, fetchImpl = fetch }: ClientOptions,
): Promise<NextPracticeResult> {
	const startedAt = performance.now();
	const unavailable = (reason: UnavailableReason): NextPracticeResult => ({
		kind: "unavailable",
		reason,
		latencyMs: Math.round(performance.now() - startedAt),
	});

	let body: unknown;
	try {
		const response = await fetchImpl(
			`${apiUrl}/next-practice?student_id=${encodeURIComponent(studentId)}`,
			{
				signal: AbortSignal.timeout(timeoutMs),
			},
		);
		if (!response.ok) return unavailable("api_error");
		body = await response.json();
	} catch (error) {
		if (isTimeoutError(error)) return unavailable("timeout");
		// A 2xx whose body is not JSON is a bad response; anything else thrown is the network.
		return unavailable(error instanceof SyntaxError ? "invalid_response" : "network");
	}

	const parsed = responseSchema.safeParse(body);
	if (!parsed.success) return unavailable("invalid_response");
	if (!parsed.data.success) return unavailable("api_error");

	return {
		kind: "ok",
		data: parsed.data.data,
		latencyMs: Math.round(performance.now() - startedAt),
	};
}
