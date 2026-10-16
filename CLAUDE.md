# Practice Coach (take-home exercise)

Working repo for a 6-hour take-home: "What should I practice next, and why?" for one student, using a raw `attempts.json` export. Reviewers score, in this order: judgment under a time budget, a real failure path, product sense (a 14-year-old must understand it and want to click), code quality, and how tradeoffs are communicated. The README and the live presentation are in English.

## Hard constraints

- 6 hours, hard stop. A small, well-reasoned submission beats a big one. Prefer deleting to adding.
- Do NOT build: authentication, a database (read the JSON file), admin or teacher views, more than one screen, Docker, CI, cloud config, a component library or design system, exhaustive tests (2 or 3 tests on the logic that deserves them).
- Ask before adding any dependency.
- Never invent data. If a fact is not in `attempts.json`, it does not appear in the product.
- The author must be able to explain and defend every line as their own. Keep code plain: no cleverness for its own sake.

## Layout

```
.
├── apps/
│   ├── api/                 Express 5 service, port 3001
│   │   └── src/
│   │       ├── app.ts       bootstrap: json, routes, errorHandler, listen
│   │       ├── lib/         app-error.ts, logger.ts
│   │       │                cleaning.ts (pure: raw export -> clean attempts + CleaningReport), cleaning.test.ts
│   │       │                selection.ts (pure: attempts -> chosen skill + evidence), selection.test.ts
│   │       │                explanation.ts (pure: validation of model output + fallback templates), explanation.test.ts
│   │       │                get-explanation.ts (calls the provider, validates, falls back, never throws), get-explanation.test.ts
│   │       │                llm/ ollama.ts, index.ts (loadPrompt, createProvider), prompts/motivation.v1.txt
│   │       ├── middleware/  validate-request.middleware.ts, error-handler.middleware.ts, index.ts (barrel)
│   │       └── modules/next-practice/
│   │           ├── next-practice.routes.ts
│   │           ├── next-practice.controllers.ts
│   │           ├── next-practice.services.ts   orchestration only
│   │           └── index.ts
│   └── web/                 Express 5 server that renders HTML, port 3000
│       └── src/
│           ├── server.ts    GET / (the one screen), plain 404, one JSON log line per request
│           ├── api/         client.ts: HTTP client for apps/api (the only place that fetches), client.test.ts
│           ├── lib/         config.ts, resolve-student.ts, demo-students.ts, last-resort.ts, styles.ts, log.ts, escape-html.ts
│           └── views/       layout.ts, practice-page.ts, fallback-page.ts, demo-switcher.ts (typed functions that return HTML strings), views.test.ts
├── docs/
│   └── ai-prompts/          prompts given to AI tools, numbered 01-, 02-, ... (author-owned record)
└── packages/
    ├── core/                shared contract, no business logic
    │   └── src/
    │       ├── index.ts     barrel, single entry point
    │       ├── validators/  common.ts (zod primitives)
    │       ├── types/api/   responses.ts (ApiResponse)
    │       ├── types/domain/ attempts.ts, next-practice.ts, explanation.ts (zod schemas, DTOs, Response types, ExplanationProvider contract)
    │       └── utils/       api-helpers.ts (ResponseUtil)
    └── database/            data only
        ├── data/attempts.json   RAW export (moved here from the repo root during scaffolding), never edited by hand
        └── src/index.ts         loadRawExport(): unknown
```

Dependency direction: `api -> core, database`; `web -> core`; `core` and `database` depend on nothing internal. `web` never imports `api` code; it talks to it over HTTP and parses the response with the schema from `core`.

## Canonical module pattern

Every module, middleware and bootstrap file follows `.claude/module-pattern.md`, which is adapted from the SWGAAF `financial-entities` module. Read it before writing or changing any of them, and report every deviation.

## Conventions (carried over from SWGAAF, with deliberate changes)

- TypeScript with ES modules everywhere (`"type": "module"`). Package scope is `@coach/*`, internal dependencies use `"workspace:^"`.
- Internal packages are consumed as source: `exports` points to `./src/index.ts`. There is no build step, so run with `tsx` and typecheck with `tsc --noEmit`. Deliberate change from SWGAAF: `moduleResolution: "Bundler"` and NO `.js` extensions in relative imports.
- Import between packages by package name (`@coach/core`), never by relative path. Use `import type` for types (`verbatimModuleSyntax` is on).
- One `tsconfig.base.json` at the root: strict, `noUncheckedIndexedAccess`, `isolatedModules`, `noEmit`. Each package extends it.
- Files are kebab-case. Layer suffix in plural: `x.routes.ts`, `x.controllers.ts`, `x.services.ts`. Classes PascalCase, functions and variables camelCase, constants UPPER_SNAKE_CASE. Named exports only, with two exceptions copied from SWGAAF: each `*.routes.ts` default-exports its router (re-exported by `index.ts` as `<camelCase>Router`) and `app.ts` default-exports the app.
- Zod 4. Every request schema is `z.object({ params, query, body })` and each part is `.strict()`. Types come from `z.infer`, never written twice.
- Routes chain `validateRequest(schema)` then the controller. Controllers are typed arrow functions with try/catch calling `next(error)`; the query DTO is typed through the fourth generic of `Request`. Services contain no HTTP. A missing resource is `null` from the service and a 404 from the controller.
- All business logic (cleaning, selection, explanation validation and fallback templates) lives as pure functions in `apps/api/src/lib/`, each with its test beside it. The module's service only orchestrates them and contains no HTTP.
- Every response uses the envelope: success `{ success: true, message?, data }`, error `{ success: false, message, data: null, error }`. Unexpected errors return a generic 500 message; the real error goes to the log only.
- No `any` (lint error), with one exception: the return type of `validateRequest`, which carries a justified `eslint-disable` comment. No floating promises. Comments are sparse, in English, and explain the why, not the what.
- Everything in English: code, comments, API messages, student-facing copy. Student-facing text is not localized (no i18n); the README lists localization as a next step.
- Formatting: Prettier with tabs, double quotes, semicolons, trailing commas, `printWidth` 100. ESLint 9 flat config with `typescript-eslint` and `eslint-config-prettier`.

## Commands

- `pnpm install`, `pnpm dev` (api and web in parallel), `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format`, `pnpm format:check`.
- Environment (documented in `.env.example`): `PORT`, `HOST`, `BASE_API`, `API_URL`, `WEB_API_TIMEOUT_MS`, `DEMO_STUDENT_SWITCHER`, `DEFAULT_STUDENT_ID`, `LLM_PROVIDER` (`ollama` | `none`), `OLLAMA_URL`, `OLLAMA_MODEL`, `LLM_TIMEOUT_MS`.
- There is no turbo. Plain pnpm workspaces are enough for this size; the README says so.

## Product rules (settled)

- Data: `attempts.json` stays raw. `cleaning.ts` turns it into clean attempts plus a `CleaningReport` with a count per rule. Every rule is explicit, named, counted, and listed in the README under Assumptions. Exact duplicates are removed by `attempt_id`. The same student seeing the same item on different dates is a legitimate retry and is kept. Null `seconds_spent` is kept as unknown (never zero). `seconds_spent` below 10 or above 600 is kept for correctness and hints, with the time set to unknown. Attempts dated after `exported_at` are kept and flagged `afterExport`.
- Selection: a pure, deterministic, explainable function. It returns the chosen skill plus an `evidence` object (attempts, correct, hints, most recent results). The lowest smoothed accuracy `(correct + 1) / (attempts + 2)` wins; ties go to more attempts, then to the lower skill id. Hints and recency are shown as evidence and do not change the choice. Thin evidence (fewer than 3 attempts) is flagged, handled explicitly and defended in the README.
- Explanation design (hybrid): code writes the evidence sentence, with every number taken from the evidence; the model writes one short motivating sentence with no numbers. What the student reads about their own data is therefore correct even when the model fails.
- Explanation pipeline: the provider is called with an `AbortSignal` timeout and returns `unknown`. The result is parsed with a zod schema from `core`, then checked by business rules (length, exactly one sentence, no digits at all, no markup or links, no praise the data does not support). Any failure uses the deterministic fallback.
- Every response says where the text came from: `source: "llm" | "fallback"` and `fallbackReason: "timeout" | "provider_error" | "invalid_output" | "disabled"`. One structured log line per request records provider, model, prompt version, latency, source, and reason. This is how production would show that the model is failing.
- Provider contract (`ExplanationProvider`) lives in `core`. Implementations live in `apps/api/src/lib/llm/`. Adding a provider means implementing the contract there and registering it in `llm/index.ts`.
- The prompt is versioned in `apps/api/src/lib/llm/prompts/` (the filename carries the version) and loaded at runtime.
- Web: one request from the browser, HTML rendered on the server, CSS inline, no client JavaScript, system fonts, `viewport` meta set. Aim for an initial HTML under about 14 KB (a common rule of thumb for the first TCP round trips). Every dynamic string is HTML-escaped, especially model text. If the API is slow or down, the web server still returns a page with safe, generic content.

- Web copy and controls: the page greets the student by first name. The "view as" student switcher is a demo aid behind `DEMO_STUDENT_SWITCHER` (default on, the page says it is demo only); a real account takes the student id from the signed-in session, never from the query string, which would be an IDOR hole. There is no call-to-action button, because there is no second screen and a button that does nothing is a fake control. The only interaction is a native `<details>` that opens the numbers behind the suggestion. The last-resort page claims nothing about the student.

## Open decisions (do not settle silently; ask the author)

None at the moment.

## Working agreements

- Work in small steps. After each step run typecheck, lint and tests, and report what changed and anything that deviates from this file.
- Do not run any git command that changes state (`init`, `add`, `commit`, `push`, `reset`, `config`, and so on). The author manages git and makes every commit. Read-only commands (`status`, `diff`, `log`) are fine.
- Never create, edit or delete anything under `docs/`. The author keeps the record of AI prompts there and creates the folder manually.
- When this file and a request disagree, say so and ask.
