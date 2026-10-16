import { describe, expect, it } from "vitest";
import type { NextPracticeResponse } from "@coach/core";
import { renderFallbackPage } from "./fallback-page";
import { renderPracticePage } from "./practice-page";

const data: NextPracticeResponse = {
	studentId: "stu_1041",
	firstName: "<script>alert(1)</script>",
	skillId: "lin_eq_1",
	skillName: `" onmouseover="alert(1)`,
	evidence: {
		attempts: 7,
		correct: 2,
		hints: 4,
		recentResults: [false, false, false, true, false],
		daysSinceLastAttempt: 0,
		thinEvidence: false,
	},
	explanation: "<img src=x onerror=alert(1)> Take a short round.",
	source: "llm",
	fallbackReason: null,
};

describe("views", () => {
	it("escape hostile values and never emit a script tag", () => {
		// The student id reaches an attribute (the retry link) and a select value, so it is hostile too.
		const options = { demoSwitcher: true, studentId: `x" onmouseover="alert(1)` };
		const pages = [renderPracticePage(data, options), renderFallbackPage(options)];

		for (const html of pages) {
			expect(html.toLowerCase()).not.toContain("<script");
			expect(html).not.toContain(`" onmouseover="`);
			expect(html).not.toContain("<img");
		}

		const practice = pages[0] ?? "";
		expect(practice).toContain("Hi, &lt;script&gt;alert(1)&lt;/script&gt;!");
		expect(practice).toContain("&lt;img src=x onerror=alert(1)&gt; Take a short round.");
		expect(practice).toContain("&quot; onmouseover=&quot;alert(1)");

		// The retry link keeps the hostile id inside its attribute.
		expect(pages[1]).toContain(`href="/?student_id=x%22%20onmouseover%3D%22alert(1)"`);

		// 7 attempts but only 5 recent results: the copy says the list is a part of the history.
		expect(practice).toContain("In total: 7 tries, 2 right, 4 with a hint.");
		expect(practice).toContain("Your last 5 of 7 tries, oldest first:");

		const short = renderPracticePage(
			{
				...data,
				evidence: {
					...data.evidence,
					attempts: 3,
					correct: 1,
					recentResults: [true, false, false],
				},
			},
			options,
		);
		expect(short).toContain("Your 3 tries, oldest first:");

		// The start button opens an in-page note, and the skill name inside it is escaped like everywhere else.
		const hostileSkill = renderPracticePage(
			{ ...data, skillName: "<script>alert(1)</script>" },
			options,
		);
		expect(practice).toContain(`href="#start"`);
		expect(practice).toContain("Practice questions are not part of this exercise.");
		expect(hostileSkill).toContain(
			"this opens your first question on &lt;script&gt;alert(1)&lt;/script&gt;.",
		);
		expect(hostileSkill.toLowerCase()).not.toContain("<script");
		// The fallback page has no recommendation to start.
		expect(pages[1]).not.toContain("Start practicing");
	});
});
