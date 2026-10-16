import { describe, expect, it } from "vitest";
import type { ExplanationProvider, ProviderInput, Selection } from "@coach/core";
import { buildEvidenceSentence } from "./explanation";
import { getExplanation } from "./get-explanation";

const selection = (overrides: Partial<Selection["evidence"]> = {}): Selection => ({
	skillId: "lin_eq_1",
	skillName: "Linear equations",
	score: 1 / 3,
	evidence: {
		attempts: 7,
		correct: 2,
		hints: 4,
		recentResults: [false, false, false, true, false],
		daysSinceLastAttempt: 0,
		thinEvidence: false,
		...overrides,
	},
});

const fakeProvider = (generate: ExplanationProvider["generate"]): ExplanationProvider => ({
	name: "fake",
	model: "fake-model",
	generate,
});

const run = (provider: ExplanationProvider | null, timeoutMs = 1000) =>
	getExplanation({ selection: selection(), provider, system: "system prompt", timeoutMs });

describe("getExplanation", () => {
	it("falls back for every failure and keeps the evidence sentence", async () => {
		const evidenceSentence = buildEvidenceSentence(selection());

		const waitsForAbort = fakeProvider(
			(_input, signal) =>
				new Promise((_resolve, reject) => {
					signal.addEventListener("abort", () => reject(signal.reason));
				}),
		);
		const rejects = fakeProvider(async () => {
			throw new Error("model is down");
		});
		const badValue = fakeProvider(async () => ({ message: "You have 5 tries." }));

		const timeout = await run(waitsForAbort, 20);
		const providerError = await run(rejects);
		const invalidOutput = await run(badValue);
		const disabled = await run(null);

		expect(timeout).toMatchObject({ source: "fallback", fallbackReason: "timeout" });
		expect(providerError).toMatchObject({ source: "fallback", fallbackReason: "provider_error" });
		expect(invalidOutput).toMatchObject({
			source: "fallback",
			fallbackReason: "invalid_output",
			invalidRule: "digits",
		});
		expect(disabled).toMatchObject({ source: "fallback", fallbackReason: "disabled" });

		for (const result of [timeout, providerError, invalidOutput, disabled]) {
			expect(result.explanation.startsWith(`${evidenceSentence} `)).toBe(true);
		}
	});

	it("uses the model sentence when it is valid, and builds both evidence templates", async () => {
		let received: ProviderInput | undefined;
		const good = fakeProvider(async (input) => {
			received = input;
			return { message: "Take a short round and see how it feels." };
		});

		const result = await run(good);

		expect(result).toMatchObject({ source: "llm", fallbackReason: null, invalidRule: null });
		expect(result.explanation).toBe(
			"You got 2 of 7 tries right on Linear equations, and you used a hint on 4 of them. Take a short round and see how it feels.",
		);
		// The model never receives numbers or the student's name.
		expect(received).toEqual({
			system: "system prompt",
			user: "Skill to practice: Linear equations.",
		});

		expect(buildEvidenceSentence(selection({ hints: 0 }))).toBe(
			"You got 2 of 7 tries right on Linear equations.",
		);
		expect(buildEvidenceSentence(selection({ attempts: 1, thinEvidence: true }))).toBe(
			"You have only tried Linear equations 1 time so far, so this is an early look.",
		);
		expect(buildEvidenceSentence(selection({ attempts: 2, thinEvidence: true }))).toBe(
			"You have only tried Linear equations 2 times so far, so this is an early look.",
		);
	});
});
