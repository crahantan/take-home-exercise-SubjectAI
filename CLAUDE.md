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
│   │       ├── lib/         app-error.ts, logger.ts, llm/ (provider implementations + prompts/)
│   │       ├── middleware/  validate-request.ts, error-handler.ts, index.ts (barrel)
│   │       └── modules/next-practice/
│   │           ├── next-practice.routes.ts
│   │           ├── next-practice.controllers.ts
│   │           ├── next-practice.services.ts   orchestration only
│   │           ├── cleaning.ts                 pure: raw export -> clean attempts + CleaningReport
│   │           ├── selection.ts                pure: attempts -> chosen skill + evidence
│   │           ├── explanation.ts              pure: validation of model output + fallback templates
│   │           ├── *.test.ts
│   │           └── index.ts
│   └── web/                 Express 5 server that renders HTML, port 3000
│       └── src/
│           ├── server.ts
│           ├── api/         HTTP client for apps/api (the only place that fetches)
│           ├── lib/         escape-html.ts, formatting helpers, last-resort content
│           └── views/       typed functions that return HTML strings
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

## Conventions (carried over from SWGAAF, with deliberate changes)

- TypeScript with ES modules everywhere (`"type": "module"`). Package scope is `@coach/*`, internal dependencies use `"workspace:^"`.
- Internal packages are consumed as source: `exports` points to `./src/index.ts`. There is no build step, so run with `tsx` and typecheck with `tsc --noEmit`. Deliberate change from SWGAAF: `moduleResolution: "Bundler"` and NO `.js` extensions in relative imports.
- Import between packages by package name (`@coach/core`), never by relative path. Use `import type` for types (`verbatimModuleSyntax` is on).
- One `tsconfig.base.json` at the root: strict, `noUncheckedIndexedAccess`, `isolatedModules`, `noEmit`. Each package extends it.
- Files are kebab-case. Layer suffix in plural: `x.routes.ts`, `x.controllers.ts`, `x.services.ts`. Classes PascalCase, functions and variables camelCase, constants UPPER_SNAKE_CASE. Named exports only, no default exports.
- Zod 4. Every request schema is `z.object({ params, query, body })` and each part is `.strict()`. Types come from `z.infer`, never written twice.
- Routes chain `validateRequest(schema)` then the controller. Controllers are typed arrow functions with try/catch calling `next(error)`. Services contain no HTTP. A missing resource is `null` from the service and a 404 from the controller.
- Every response uses the envelope: success `{ success: true, message?, data }`, error `{ success: false, message, data: null, error }`. Unexpected errors return a generic 500 message; the real error goes to the log only.
- No `any` (lint error). No floating promises. Comments are sparse, in English, and explain the why, not the what.
- Everything in English: code, comments, API messages, student-facing copy. Student-facing text is not localized (no i18n); the README lists localization as a next step.
- Formatting: Prettier with tabs, double quotes, semicolons, trailing commas, `printWidth` 100. ESLint 9 flat config with `typescript-eslint` and `eslint-config-prettier`.

## Commands

- `pnpm install`, `pnpm dev` (api and web in parallel), `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format`, `pnpm format:check`.
- Environment (documented in `.env.example`): `PORT`, `API_URL`, `LLM_PROVIDER` (`ollama` | `none`), `OLLAMA_URL`, `OLLAMA_MODEL`, `LLM_TIMEOUT_MS`.
- There is no turbo. Plain pnpm workspaces are enough for this size; the README says so.

## Product rules (settled)

- Data: `attempts.json` stays raw. `cleaning.ts` turns it into clean attempts plus a `CleaningReport` with a count per rule. Every rule is explicit, named, counted, and listed in the README under Assumptions. Exact duplicates are removed by `attempt_id`. The same student seeing the same item on different dates is a legitimate retry and is kept.
- Selection: a pure, deterministic, explainable function. It returns the chosen skill plus an `evidence` object (attempts, correct, hints, most recent results). Thin evidence is handled explicitly and defended in the README.
- Explanation pipeline: the provider is called with an `AbortSignal` timeout and returns `unknown`. The result is parsed with a zod schema from `core`, then checked by business rules (length, sentence count, no numbers outside the evidence, no markup or links, no praise the data does not support). Any failure uses the deterministic fallback.
- Every response says where the text came from: `source: "llm" | "fallback"` and `fallbackReason: "timeout" | "provider_error" | "invalid_output" | "disabled"`. One structured log line per request records provider, model, prompt version, latency, source, and reason. This is how production would show that the model is failing.
- Provider contract (`ExplanationProvider`) lives in `core`. Implementations live in `apps/api/src/lib/llm/`. Adding a provider means implementing the contract there and registering it in `llm/index.ts`.
- The prompt is versioned in `apps/api/src/lib/llm/prompts/` (the filename carries the version) and loaded at runtime.
- Web: one request from the browser, HTML rendered on the server, CSS inline, no client JavaScript, system fonts, `viewport` meta set. Aim for an initial HTML under about 14 KB (a common rule of thumb for the first TCP round trips). Every dynamic string is HTML-escaped, especially model text. If the API is slow or down, the web server still returns a page with safe, generic content.

## Open decisions (do not settle silently; ask the author)

- Explanation design: the model writes the whole message, or code writes a deterministic evidence sentence and the model writes one short motivating sentence.
- The selection formula and how thin evidence is treated.
- Which cleaning rules apply to missing and extreme `seconds_spent` and to attempts dated after `exported_at`.

## Working agreements

- Work in small steps. After each step run typecheck, lint and tests, and report what changed and anything that deviates from this file.
- Do not run any git command that changes state (`init`, `add`, `commit`, `push`, `reset`, `config`, and so on). The author manages git and makes every commit. Read-only commands (`status`, `diff`, `log`) are fine.
- Never create, edit or delete anything under `docs/`. The author keeps the record of AI prompts there and creates the folder manually.
- When this file and a request disagree, say so and ask.
