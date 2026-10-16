import { escapeHtml } from "../lib/escape-html";
import { LAST_RESORT } from "../lib/last-resort";
import { renderDemoSwitcher } from "./demo-switcher";
import { renderLayout } from "./layout";
import type { PageOptions } from "./practice-page";

/** Last resort when the api cannot answer. It claims nothing about the student. */
export const renderFallbackPage = (options: PageOptions): string => {
	// The switcher is the only way to see another student, so retrying must keep the choice.
	const retryHref = options.demoSwitcher
		? `/?student_id=${encodeURIComponent(options.studentId)}`
		: "/";

	const body = `<h1>${escapeHtml(LAST_RESORT.heading)}</h1>
<p class="lead">${escapeHtml(LAST_RESORT.message)}</p>
<p><a class="button" href="${escapeHtml(retryHref)}">${escapeHtml(LAST_RESORT.retryLabel)}</a></p>
<p>${escapeHtml(LAST_RESORT.tip)}</p>
${options.demoSwitcher ? renderDemoSwitcher(options.studentId) : ""}`;

	return renderLayout({ title: LAST_RESORT.title, body });
};
