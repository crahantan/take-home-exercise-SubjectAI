# 03. Small fixes after aligning the scaffold

- Tool: Claude Code, run from the repo root with `CLAUDE.md` and `.claude/module-pattern.md` in place
- Date: 2026-10-16
- Purpose: after prompt 02 the report listed four deviations and some breaking changes. I reviewed them and kept the ones that match the pattern. This prompt fixes what I want different: a JSON 404 for unknown routes, runtime validation of API responses on the web side, an up-to-date `.env.example`, and a Prettier setup that does not reformat reference and prompt files.

## Prompt

```
Read CLAUDE.md and .claude/module-pattern.md first. Task: five small fixes on top of the aligned scaffold. Do not run any git command that changes state. Do not touch docs/.

1. apps/api: restore a JSON 404 for unknown routes. Export a notFoundHandler from middleware/error-handler.middleware.ts that answers 404 with ResponseUtil.error(null, "Route not found"), and mount it in app.ts after the routers and before errorHandler.
2. packages/core: the web client must validate API responses at runtime and narrow on success. In types/api/responses.ts add a generic apiResponseSchema(dataSchema) built with z.discriminatedUnion("success", ...): the success branch is { success: true, message?: string, data: <dataSchema> } and the error branch is { success: false, message?: string, data: null, error: unknown }. In types/domain/next-practice.ts replace the NextPracticeResponse interface with a zod schema nextPracticeResponseSchema and export type NextPracticeResponse = z.infer<typeof nextPracticeResponseSchema>. Keep the ApiResponse interface and ResponseUtil as they are for the api controllers. Export everything from the barrel.
3. .env.example: add HOST and BASE_API with their defaults and a one-line comment for each variable. Make sure the README's run instructions say that every variable has a default, so pnpm dev works with no .env.
4. .prettierignore: add .claude/ and docs/ai-prompts/ (reference files and verbatim prompts must not be reformatted). Then pnpm format:check must pass.
5. Update .claude/module-pattern.md so it matches the final code exactly, including notFoundHandler and the response schemas.

Verify: curl an unknown path and confirm a JSON 404 envelope; pnpm typecheck, lint and format:check all pass. Report every deviation from the pattern.
```

## Outcome and what I changed afterwards

All five fixes were applied and verified: typecheck, lint and format:check pass, and unknown routes now return a JSON 404 envelope. I accepted three small deviations: the pattern file now holds the Prettier-wrapped code, apiResponseSchema keeps an inferred return type, and docs was already in .prettierignore so my extra entry is redundant. Two things remain on purpose: the web client still casts the response and will switch to apiResponseSchema when I build the screen, and the README will state that the browser never calls the API when I write it in full.
