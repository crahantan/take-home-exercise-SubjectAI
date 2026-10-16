import express from "express";
import type { Application } from "express";
import { fetchNextPractice } from "./api/client";
import { loadConfig } from "./lib/config";
import { log } from "./lib/log";
import { resolveStudentId } from "./lib/resolve-student";
import { renderLayout } from "./views/layout";
import { renderFallbackPage } from "./views/fallback-page";
import { renderPracticePage } from "./views/practice-page";

const config = loadConfig();
// The api serves its routes under /api (its BASE_API default).
const apiBaseUrl = `${config.apiUrl}/api`;

const app: Application = express();

app.get("/", async (req, res) => {
	const studentId = resolveStudentId(req.query, config);
	const options = { demoSwitcher: config.demoSwitcher, studentId };

	const result = await fetchNextPractice(studentId, {
		apiUrl: apiBaseUrl,
		timeoutMs: config.apiTimeoutMs,
	});
	const html =
		result.kind === "ok" ? renderPracticePage(result.data, options) : renderFallbackPage(options);

	log({
		event: "page_rendered",
		studentId,
		outcome: result.kind === "ok" ? "ok" : result.reason,
		apiLatencyMs: result.latencyMs,
		source: result.kind === "ok" ? result.data.source : null,
		fallbackReason: result.kind === "ok" ? result.data.fallbackReason : null,
		bytes: Buffer.byteLength(html),
	});

	// Per-student content, so shared caches must not keep it.
	res
		.status(200)
		.set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-cache" })
		.send(html);
});

app.use((_req, res) => {
	const body = `<h1>Page not found</h1>\n<p><a class="button" href="/">Go to the home page</a></p>`;
	res
		.status(404)
		.set({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-cache" })
		.send(renderLayout({ title: "Page not found", body }));
});

app.listen(config.port, () => {
	log({
		event: "web_started",
		url: `http://localhost:${config.port}`,
		demoStudentSwitcher: config.demoSwitcher ? "on" : "off",
	});
});
