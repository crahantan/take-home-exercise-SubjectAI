import type { ApiResponse } from "@coach/core";

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const API_TIMEOUT_MS = 5000;

// Stub: the response is still unvalidated. It will be parsed with a schema from core.
export const fetchNextPractice = async (): Promise<ApiResponse<unknown>> => {
	const response = await fetch(`${API_URL}/api/next-practice`, {
		signal: AbortSignal.timeout(API_TIMEOUT_MS),
	});
	return (await response.json()) as ApiResponse<unknown>;
};
