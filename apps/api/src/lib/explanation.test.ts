import { describe, expect, it } from "vitest";
import { buildFallbackMotivation, validateMotivation } from "./explanation";

describe("validateMotivation", () => {
	it("accepts a good sentence and rejects each rule", () => {
		expect(validateMotivation({ message: "  Take a short round and see how it feels.  " })).toEqual(
			{
				ok: true,
				message: "Take a short round and see how it feels.",
			},
		);

		const rule = (raw: unknown) => {
			const check = validateMotivation(raw);
			return check.ok ? "ok" : check.rule;
		};

		expect(rule("just a string")).toBe("shape");
		expect(rule({ message: "Try it.", extra: true })).toBe("shape");
		expect(rule({ message: "   " })).toBe("length");
		expect(rule({ message: `${"a".repeat(100)}.` })).toBe("length");
		expect(rule({ message: "Try it. Then try again." })).toBe("sentence_count");
		expect(rule({ message: "Try it without an ending" })).toBe("sentence_count");
		expect(rule({ message: "Try it 3 more times." })).toBe("digits");
		expect(rule({ message: "Try <b>this</b> now." })).toBe("markup");
		expect(rule({ message: "Look at http://go now." })).toBe("markup");
		expect(rule({ message: "You are doing great on this." })).toBe("praise");

		// Both fixed fallback texts must pass the same rules they stand in for.
		for (const thinEvidence of [true, false]) {
			const evidence = {
				attempts: 5,
				correct: 2,
				hints: 1,
				recentResults: [],
				daysSinceLastAttempt: 0,
				thinEvidence,
			};
			expect(validateMotivation({ message: buildFallbackMotivation(evidence) }).ok).toBe(true);
		}
	});
});
