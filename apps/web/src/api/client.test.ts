import { describe, expect, it } from "vitest";
import { fetchNextPractice } from "./client";
import type { FetchImpl } from "./client";

const payload = {
	studentId: "stu_1041",
	firstName: "Ana",
	skillId: "lin_eq_1",
	skillName: "Linear equations",
	evidence: {
		attempts: 7,
		correct: 2,
		hints: 4,
		recentResults: [false, true],
		daysSinceLastAttempt: 0,
		thinEvidence: false,
	},
	explanation: "You got 2 of 7 tries right. A short round is a good next step.",
	source: "fallback",
	fallbackReason: "disabled",
};

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const options = (fetchImpl: FetchImpl, timeoutMs = 1000) => ({
	apiUrl: "http://api.test/api",
	timeoutMs,
	fetchImpl,
});

describe("fetchNextPractice", () => {
	it("returns ok for a valid payload and a reason for every failure", async () => {
		let requestedUrl = "";
		const ok = await fetchNextPractice(
			"stu_1041",
			options(async (url) => {
				requestedUrl = url;
				return jsonResponse({ success: true, message: "ok", data: payload });
			}),
		);
		expect(ok).toMatchObject({ kind: "ok", data: payload });
		expect(requestedUrl).toBe("http://api.test/api/next-practice?student_id=stu_1041");

		const reason = async (fetchImpl: FetchImpl, timeoutMs?: number) => {
			const result = await fetchNextPractice("stu_1041", options(fetchImpl, timeoutMs));
			return result.kind === "unavailable" ? result.reason : "ok";
		};

		const badSchema = { success: true, data: { ...payload, source: "gpt" } };
		expect(await reason(async () => jsonResponse(badSchema))).toBe("invalid_response");
		expect(await reason(async () => new Response("<html>oops</html>"))).toBe("invalid_response");
		expect(await reason(async () => jsonResponse({ success: false, data: null }, 404))).toBe(
			"api_error",
		);
		// A 2xx that says success: false is still an api error.
		expect(
			await reason(async () =>
				jsonResponse({ success: false, message: "x", data: null, error: null }),
			),
		).toBe("api_error");
		expect(
			await reason(async () => {
				throw new TypeError("fetch failed");
			}),
		).toBe("network");

		const waitsForAbort: FetchImpl = (_url, init) =>
			new Promise((_resolve, reject) => {
				init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
			});
		expect(await reason(waitsForAbort, 20)).toBe("timeout");
	});
});
