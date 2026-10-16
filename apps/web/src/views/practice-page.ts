import type { NextPracticeResponse } from "@coach/core";
import { escapeHtml } from "../lib/escape-html";
import { renderDemoSwitcher } from "./demo-switcher";
import { renderLayout } from "./layout";

export interface PageOptions {
	demoSwitcher: boolean;
	studentId: string;
}

/** A symbol and a color for each result, so color is never the only signal. */
const renderResult = (isCorrect: boolean): string =>
	isCorrect
		? `<li class="right"><span role="img" aria-label="right">✓</span></li>`
		: `<li class="wrong"><span role="img" aria-label="wrong">✗</span></li>`;

export const renderPracticePage = (data: NextPracticeResponse, options: PageOptions): string => {
	const { evidence } = data;
	const { attempts, correct, hints } = evidence;
	const shown = evidence.recentResults.length;
	// The window can be smaller than the total, so the line says which part of the history the list shows.
	const recentIntro =
		shown < attempts
			? `Your last ${shown} of ${attempts} tries, oldest first:`
			: `Your ${shown} ${shown === 1 ? "try" : "tries"}, oldest first:`;
	const aiNote =
		data.source === "llm"
			? `\n<p class="note">The last sentence is written by an AI assistant.</p>`
			: "";

	const body = `<h1>Hi, ${escapeHtml(data.firstName)}!</h1>
<p class="lead">Here is what we think you should practice next.</p>
<section class="card">
<p class="label">Next up</p>
<h2>${escapeHtml(data.skillName)}</h2>
<p>${escapeHtml(data.explanation)}</p>${aiNote}
</section>
<details>
<summary>See how you did</summary>
<p>In total: ${attempts} ${attempts === 1 ? "try" : "tries"}, ${correct} right, ${hints} with a hint.</p>
<p>${recentIntro}</p>
<ul class="results">${evidence.recentResults.map(renderResult).join("")}</ul>
</details>
${options.demoSwitcher ? renderDemoSwitcher(options.studentId) : ""}`;

	return renderLayout({ title: "Practice Coach", body });
};
