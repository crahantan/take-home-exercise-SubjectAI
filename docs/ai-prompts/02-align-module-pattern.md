# 02. Align the scaffold with the canonical module pattern

- Tool: Claude Code, run from the repo root with `CLAUDE.md` and `.claude/module-pattern.md` in place
- Date: 2026-10-16
- Purpose: the first scaffold did not follow the module structure of SWGAAF (my previous project). I extracted a complete reference module (schemas, routes, controller, service, middleware, app bootstrap) from it with a read-only prompt, adapted it to this exercise (no auth, no database, no permissions), and asked for the stubs to be rewritten to match.

## Prompt

```
Read CLAUDE.md and .claude/module-pattern.md first. Task: align the existing scaffold with the canonical module pattern, and nothing else. Do not run any git command that changes state. Do not touch docs/.

1. packages/core: add validators/common.ts (studentIdSchema), types/domain/next-practice.ts and utils/api-helpers.ts exactly as written in the pattern file, and export everything from the barrel. ResponseUtil keeps only success and error.
2. apps/api: rewrite lib/app-error.ts, lib/logger.ts, middleware/validate-request.middleware.ts, middleware/error-handler.middleware.ts, middleware/index.ts, modules/next-practice/* (routes, controllers, services, index) and app.ts to match the pattern file. The service stays a stub that throws AppError("Not implemented yet", 501).
3. Remove any scaffold file that the pattern replaces (for example the old middleware file names) and update the imports. Add no dependency; if the scaffold already loads .env, keep that mechanism.
4. Verify with curl against the running api: GET /api/health returns 200; GET /api/next-practice (no student_id) returns 400 with the error envelope; ?student_id=abc returns 400; ?student_id=stu_1041&x=1 returns 400 (strict query); ?student_id=stu_1041 returns 501. Then run pnpm typecheck, lint and format:check.
5. Report the final tree of apps/api/src and packages/core/src, and every place where you had to deviate from the pattern and why.
```

## Outcome and what I changed afterwards

Claude Code aligned the stubs with the pattern and reported four deviations. I kept the Prettier re-wrapping and the new error envelope (error: unknown, same as SWGAAF). I did not keep two things: the missing JSON 404 for unknown routes and the Prettier failure on the reference file, both fixed in prompt 03. I also decided the web side must validate API responses at runtime, which became the zod response schemas in 03.
