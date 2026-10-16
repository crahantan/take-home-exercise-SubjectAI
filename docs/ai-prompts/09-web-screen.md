# 09. The one screen (server-rendered, no client JavaScript)

- Tool: Claude Code, run from the repo root with `CLAUDE.md` and `.claude/module-pattern.md` in place
- Date: 2026-10-16
- Purpose: build the single screen a 14-year-old sees on a low-end phone over 3G, and make the web server the only caller of the api. I decided the product choices before writing this prompt. The greeting uses the student's first name because this is an educational app and should feel warm. A "view as" student switcher exists only as a demo aid for the exercise (a real account would take the student id from the signed-in session, never from a query string, which would be an IDOR hole), so it sits behind an environment flag and the page says it is demo only. The page has no call-to-action button because there is no second screen to send the student to, and a button that does nothing would be a fake control. The interaction is a native `<details>` that opens the numbers behind the suggestion. If the api is slow or down, the student still gets a friendly page with generic content that claims nothing about them.

## Prompt

```
Read CLAUDE.md and .claude/module-pattern.md first. Task: build the web screen, and nothing else. Do not run any git command that changes state. Do not touch docs/ or README.md. Do not change anything in apps/api; if you think the api blocks something, report it instead. The only dependency you may add is vitest, as a devDependency of apps/web at the same version already used in apps/api (I approve that one here); add nothing else. Logic goes in apps/web/src/lib/, HTML in views/, and the only code that fetches is apps/web/src/api/client.ts.

1. apps/web/src/lib/config.ts: loadConfig() reads PORT (keep whatever mechanism the scaffold already uses for the web port, default 3000), API_URL (default as in the scaffold), WEB_API_TIMEOUT_MS (default 8000, it must be longer than the api's LLM timeout), DEMO_STUDENT_SWITCHER ("on" or "off", default "on") and DEFAULT_STUDENT_ID (default stu_1041, validated with studentIdSchema from @coach/core). An invalid value throws at startup with a clear message. Write one console line at startup saying whether the demo switcher is on.

2. apps/web/src/lib/demo-students.ts: DEMO_STUDENTS as { id, firstName }[] with exactly the students in packages/database/data/attempts.json (read the file once to copy them, do not invent any), with a comment that this list exists only for the demo switcher and mirrors the export. apps/web/src/lib/resolve-student.ts, a pure function resolveStudentId(query: unknown, config): when the switcher is off it ignores the query entirely and returns DEFAULT_STUDENT_ID; when it is on it returns the query's student_id if it is a string that passes studentIdSchema, otherwise DEFAULT_STUDENT_ID.

3. apps/web/src/api/client.ts: fetchNextPractice(studentId, { apiUrl, timeoutMs, fetchImpl = fetch }) calls GET `${apiUrl}/next-practice?student_id=...` with AbortSignal.timeout(timeoutMs) and returns a discriminated result: { kind: "ok"; data: NextPracticeResponse; latencyMs } or { kind: "unavailable"; reason: "timeout" | "network" | "api_error" | "invalid_response"; latencyMs }. Parse the JSON body with apiResponseSchema(nextPracticeResponseSchema) from @coach/core and narrow on success; a non-2xx status or success false is "api_error", a body that fails the schema is "invalid_response", a TimeoutError is "timeout", any other thrown error is "network". It never throws and never casts.

4. apps/web/src/lib/last-resort.ts: the fixed strings of the fallback page. apps/web/src/lib/styles.ts: the CSS as one string. Keep the CSS under about 2 KB: system font stack, mobile first, one column with a max width of about 32rem, base text of at least 16px, tap targets of at least 44px, a calm friendly look, contrast of at least 4.5:1, and never color alone to carry meaning.

5. apps/web/src/views/ (typed functions that return HTML strings, every dynamic string passes through escapeHtml, including attribute values):
   - layout.ts: renderLayout({ title, body }) with <!doctype html>, lang="en", charset, the viewport meta (width=device-width, initial-scale=1), the inline <style> and no <script> anywhere.
   - practice-page.ts: renderPracticePage(data: NextPracticeResponse, options). Copy: an h1 `Hi, ${firstName}!`; a lead line "Here is what we think you should practice next."; a card with the small label "Next up" and the skill name as a heading; then data.explanation as one paragraph. Below it a native <details> whose summary is "See how you did": inside, the line `Your last ${n} ${n === 1 ? "try" : "tries"} on this skill, oldest first:` followed by a list of the evidence.recentResults, each item a "✓" or a "✗" with an aria-label of "right" or "wrong" (symbol plus color, never color alone), and then the line `Tries: ${attempts} · Right: ${correct} · Hints: ${hints}`. When data.source is "llm", add a small line "The last sentence is written by an AI assistant." There is no call-to-action button.
   - fallback-page.ts: renderFallbackPage(options), the last-resort page: an h1 "Hi!", the line "We could not load your next practice right now. Please try again in a moment.", a real "Try again" link back to the same page, and the generic tip "In the meantime, pick a skill that feels tricky and try a few problems." It must claim nothing about the student.
   - Both pages end with the demo switcher when the flag is on: a plain `<form method="get" action="/">` with a label "Demo only: view as", a <select name="student_id"> of DEMO_STUDENTS with the current one selected, and a submit button. No JavaScript.

6. apps/web/src/server.ts: GET / resolves the student id, calls the client and renders: "ok" -> practice page; "unavailable" -> fallback page. Both answer 200 with Content-Type text/html; charset=utf-8 and Cache-Control: private, no-cache. Write exactly one JSON log line per request (a tiny helper in lib/log.ts) with event "page_rendered", studentId, outcome ("ok" or the unavailable reason), apiLatencyMs, source and fallbackReason from the api data when present, and the response size in bytes. An unknown route gets a plain 404 page. Express 5 is already in place; add no middleware dependency (no compression, no helmet); the README will say compression belongs to the reverse proxy.

7. .env.example: add WEB_API_TIMEOUT_MS, DEMO_STUDENT_SWITCHER and DEFAULT_STUDENT_ID with defaults and one-line comments. The comment of DEMO_STUDENT_SWITCHER must say it is a demo aid only and must be "off" in any real deployment, because the student id has to come from the signed-in account.

8. Tests: exactly two vitest test blocks in apps/web, with inline fixtures and a fake fetch, never the network:
   - views: renderPracticePage and renderFallbackPage with hostile values for firstName, skillName and explanation (for example <script>alert(1)</script> and a " onmouseover=" attribute break) produce escaped output, and the HTML contains no "<script" at all;
   - client: a valid payload gives "ok" with parsed data; a payload that fails the schema gives "invalid_response"; a non-2xx gives "api_error"; a rejection gives "network"; a fake fetch that waits for the abort signal with a 20 ms timeout gives "timeout".

9. Docs inside the repo, not under docs/: update the apps/web part of the Layout tree in CLAUDE.md, add the three new variables to the Environment list, and add to Product rules the decisions above (greeting by first name, demo-only switcher behind a flag, no call-to-action button, fallback page claims nothing about the student).

10. Verify: pnpm typecheck, lint, format:check and test pass. Then start pnpm dev (Ollama is running here) and run with curl, showing the status and the log line of each:
   - GET / -> 200, practice page for stu_1041; print the size with curl -s -o /dev/null -w "%{size_download}\n" and confirm it is under 14 KB; confirm grep -c "<script" finds 0;
   - GET /?student_id=stu_2277 -> Beto's page (word_prob); GET /?student_id=%3Cscript%3E -> default student's page, not an error;
   - with DEMO_STUDENT_SWITCHER=off, GET /?student_id=stu_2277 -> still the default student, and no switcher in the HTML;
   - with the api stopped -> 200 with the fallback page and a log line with outcome "network";
   - with LLM_PROVIDER=none in the api -> the practice page still renders and the log shows fallbackReason "disabled".
   Report the HTML size of the practice page and the fallback page.

Report the files you created or changed, the curl outputs with their log lines, and every deviation from CLAUDE.md or the pattern.
```

## Outcome and what I changed afterwards

Reviewing the screen at phone width, I found that the recent tries and the totals looked contradictory, which became prompt 10.
