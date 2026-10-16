# 01. Scaffold the monorepo

- Tool: Claude Code, run from the repo root with `CLAUDE.md` in place
- Date: 2026-10-16
- Purpose: generate only the empty skeleton (workspace, tooling, package and app stubs). No domain logic, so every decision about the exercise itself is written by the author afterwards.

## Prompt

```
Read CLAUDE.md first. Task: scaffold the monorepo ONLY, with no domain logic. Do not run any git command that changes state; I make the commits myself. Do not touch docs/.

0. attempts.json is in the repo root. Compute its sha256, move it with mv to packages/database/data/attempts.json (create the folder first), compute the sha256 again and confirm it is identical. Do not modify the file.
1. Root: package.json (private, type module, packageManager pnpm, engines node >=20, scripts: dev, lint, typecheck, test, format, format:check), pnpm-workspace.yaml, tsconfig.base.json, eslint.config.js (flat config), .prettierrc.json, .prettierignore, .gitignore (it must NOT ignore attempts.json), .env.example and a minimal README.md.
2. packages/core (@coach/core): exports pointing to ./src/index.ts, a barrel file, types/api/responses.ts with ApiResponse, utils/api-helpers.ts with ResponseUtil, and validators/common.ts with one example primitive.
3. packages/database (@coach/database): export loadRawExport(): unknown, which reads data/attempts.json.
4. apps/api (@coach/api): Express 5, "dev": "tsx watch src/app.ts", GET /api/health, validate-request and error-handler middleware as described in CLAUDE.md, and the modules/next-practice folder with routes, controllers, services and index as stubs that respond 501.
5. apps/web (@coach/web): an Express 5 server that serves a minimal HTML page from views/, with lib/escape-html.ts and a stub client in src/api/.
6. Verify: pnpm install, typecheck, lint, format:check, and that pnpm dev starts api (3001) and web (3000) and both answer with curl.

Report the final tree and anything that deviated from CLAUDE.md. Ask me before adding any dependency that is not mentioned there.
```

## Outcome and what I changed afterwards

Claude Code created the workspace, the tooling and the package and app stubs, and moved attempts.json to packages/database/data without changing it (the sha256 matched before and after). Typecheck, lint and format:check passed and both servers answered with curl. I did not keep the module structure it produced: the stubs did not follow the layered pattern of my previous project (schemas, routes, controllers, services, middleware), so I extracted a reference module from that project and wrote prompt 02 to align the scaffold with it.
