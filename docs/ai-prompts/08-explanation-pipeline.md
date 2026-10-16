# 08. Explanation pipeline (hybrid), provider, validation, fallback and log

- Tool: Claude Code, run from the repo root with `CLAUDE.md` and `.claude/module-pattern.md` in place
- Date: 2026-10-16
- Purpose: connect cleaning and selection to the endpoint and write the explanation. I settled the three open decisions before writing this prompt. Explanation design is hybrid: code writes the sentence with the numbers, taken only from the evidence, and the model writes one short motivating sentence with no numbers, so everything the student reads about their own data is correct even when the model fails. The model sentence is checked by rules, and any failure uses a fixed template. Cache and warm-up call are left out on purpose and listed as next steps in the README. All logic lives in `apps/api/src/lib/`.

## Prompt

```
Read CLAUDE.md and .claude/module-pattern.md first. Task: build the explanation pipeline and connect the service, and nothing else. Do not run any git command that changes state. Do not touch docs/. Add no dependency (Node's built-in fetch and AbortSignal.timeout are enough). All logic goes in apps/api/src/lib/; the service only orchestrates and contains no HTTP.

1. packages/core, types/domain/explanation.ts (export from the barrel):
   - ProviderInput = { system: string; user: string }.
   - interface ExplanationProvider { readonly name: string; readonly model: string; generate(input: ProviderInput, signal: AbortSignal): Promise<unknown> }. A provider returns unknown on purpose; nothing it returns is trusted.
   - modelOutputSchema (zod, strict): { message: z.string() }.
   In types/domain/next-practice.ts replace nextPracticeResponseSchema with: studentId, firstName, skillId, skillName, evidence (practiceEvidenceSchema), explanation (string), source (explanationSourceSchema) and fallbackReason (fallbackReasonSchema, nullable). The type NextPracticeResponse stays z.infer. Update the controller types only if the compiler requires it.

2. apps/api/src/lib/explanation.ts, pure functions with no I/O:
   - buildEvidenceSentence(selection: Selection): string, deterministic, every number taken from selection.evidence. If evidence.thinEvidence is false: `You got ${correct} of ${attempts} tries right on ${skillName}` plus, only when hints > 0, `, and you used a hint on ${hints} of them`, ending with a period. If thinEvidence is true: `You have only tried ${skillName} ${attempts} ${attempts === 1 ? "time" : "times"} so far, so this is an early look.`
   - buildFallbackMotivation(evidence: PracticeEvidence): string, two fixed templates, no numbers, no praise: thin evidence -> "A few more tries will show how this skill is really going."; otherwise -> "A short round on this one is a good next step."
   - validateMotivation(raw: unknown): { ok: true; message: string } | { ok: false; rule: string }. First parse raw with modelOutputSchema (rule "shape"). Then check the trimmed message against named rules, returning the first one that fails: "length" (empty or longer than MAX_MOTIVATION_CHARS = 100), "sentence_count" (it must contain exactly one of . ! ? and end with it), "digits" (no digit at all, because every number comes from the evidence sentence), "markup" (none of < > { } [ ] ` and no http, www. or ://), "praise" (none of PRAISE_WORDS: great, amazing, awesome, excellent, fantastic, brilliant, perfect, well done, good job, nailed, crushed, mastered, genius, smart, proud; the chosen skill is by definition the student's weakest, so praise about it is never supported by the data). Export the constants with a one-line comment each. Never throw.

3. apps/api/src/lib/get-explanation.ts: async getExplanation({ selection, provider, system, timeoutMs }) returning { explanation: string; source: ExplanationSource; fallbackReason: FallbackReason | null; latencyMs: number; invalidRule: string | null }. It never throws. provider is ExplanationProvider | null and is injected so it can be tested with a fake.
   - provider null -> fallback, reason "disabled", no call.
   - Otherwise call provider.generate({ system, user }, AbortSignal.timeout(timeoutMs)), where user is `Skill to practice: ${skillName}.` plus, when thinEvidence is true, ` The student has tried it only a few times.` The model never receives numbers or the student's name.
   - A rejection whose error.name is "TimeoutError" -> fallback, reason "timeout". Any other rejection -> fallback, reason "provider_error".
   - A resolved value that fails validateMotivation -> fallback, reason "invalid_output", and invalidRule holds the rule that failed.
   - Success -> source "llm", fallbackReason null.
   - explanation is always `${buildEvidenceSentence(selection)} ${motivation}`, where motivation is the model message or the fallback template. latencyMs covers the whole function.

4. apps/api/src/lib/llm/:
   - ollama.ts: createOllamaProvider({ url, model }): ExplanationProvider. POST `${url}/api/chat` with { model, messages: [system, user], stream: false, format: { type: "object", properties: { message: { type: "string" } }, required: ["message"] }, options: { num_predict: 60, temperature: 0.3 }, keep_alive: "30m" } and the given signal. A non-2xx status or a body that does not match z.object({ message: z.object({ content: z.string() }) }) throws an Error. Then try JSON.parse(content) and return the result; if parsing fails return the raw content string, so validation reports it as invalid output. Comment that a reply cut by num_predict is not valid JSON and ends up as invalid_output.
   - prompts/motivation.v1.txt with exactly this text:
     You write one short motivating sentence for a student aged 13 to 15 who is about to practice a math skill. Reply with a JSON object with a single field "message". Rules: exactly one sentence, at most 15 words, friendly plain language, speak to the student as "you". Do not use any digits. Do not praise the student or say they are good at it: they are practicing this skill because it is the one that needs the most work. Do not mention scores, counts, hints or other skills. Do not use markup, emojis or links.
   - index.ts: loadPrompt(): { version: string; text: string } reads the prompt file at runtime relative to import.meta.url; the version comes from the filename (motivation.v1.txt -> "v1"). createProvider(): ExplanationProvider | null reads LLM_PROVIDER ("ollama" by default, or "none" -> null; any other value throws at startup), OLLAMA_URL (default http://localhost:11434), OLLAMA_MODEL (default qwen2.5:3b) and LLM_TIMEOUT_MS (default 6000, exported as a helper). Adding a provider means implementing the contract in this folder and registering it here.

5. apps/api/src/modules/next-practice/next-practice.services.ts: replace the stub. On construction, read loadRawExport() and run cleanExport once, keep the clean data in memory, log the CleaningReport as one structured line, and create the provider and prompt once. getNextPractice(data) then: returns null when student_id is not in the export's students; throws AppError("No attempts found for this student", 404) when the student exists but selectNextSkill returns null; otherwise calls getExplanation and returns the NextPracticeResponse, with firstName taken from the export. Before returning, write exactly one logger.info line with event "next_practice_explained" and the fields studentId, skillId, provider (or "none"), model (or null), promptVersion, latencyMs, source, fallbackReason, invalidRule and thinEvidence.

6. .env.example: make sure PORT, HOST, BASE_API, LLM_PROVIDER, OLLAMA_URL, OLLAMA_MODEL and LLM_TIMEOUT_MS are present with the defaults above and a one-line comment each. Do not edit README.md.

7. Tests: exactly three new vitest test blocks in apps/api/src/lib/, with inline fixtures and fake providers, never a real model:
   - explanation.test.ts: validateMotivation accepts a good sentence and rejects each rule (shape, length, sentence_count, digits, markup, praise), and both fallback templates pass validateMotivation themselves;
   - get-explanation.test.ts, failure path: a provider that waits for the abort signal with a 20 ms timeout gives reason "timeout"; a provider that rejects gives "provider_error"; a provider that resolves a bad value gives "invalid_output" with the rule; a null provider gives "disabled"; in all four cases the explanation still starts with the same evidence sentence;
   - get-explanation.test.ts, success path: a good fake output gives source "llm" and fallbackReason null, and buildEvidenceSentence is checked for the thin and the normal template.

8. Docs inside the repo, not under docs/:
   - CLAUDE.md: update the Layout tree (lib/ now holds explanation.ts, get-explanation.ts and llm/ with ollama.ts, index.ts and prompts/motivation.v1.txt; explanation.ts is no longer "planned"). In Product rules, add the settled decisions: hybrid explanation design (code writes the evidence sentence, the model writes one number-free sentence), the selection formula (lowest smoothed accuracy (correct + 1) / (attempts + 2), ties by more attempts then skill id, thin evidence flagged below 3 attempts), and the cleaning rules (null seconds kept as unknown, seconds below 10 or above 600 kept as unknown, attempts after exported_at kept and flagged). Remove those three items from Open decisions, and change the explanation-pipeline rule so it says the model sentence may contain no digits at all.
   - .claude/module-pattern.md: update the service section to match the final code.

9. Verify: pnpm typecheck, lint, format:check and test pass. Then start the api and run these with curl, showing the response and the log line of each:
   - LLM_PROVIDER=none, student_id=stu_1041 -> 200, source "fallback", reason "disabled";
   - LLM_PROVIDER=ollama with OLLAMA_URL=http://localhost:1 -> 200, reason "provider_error";
   - the default Ollama URL with LLM_TIMEOUT_MS=1 -> 200, reason "timeout" (if no Ollama runs here this will be provider_error; say so);
   - student_id=stu_9999 -> 404; student_id=abc -> 400.
   If Ollama is reachable from this environment, also run once with the defaults and report whether the result is source "llm" or a fallback and why.

Report the files you created or changed, the curl outputs with their log lines, and every deviation from CLAUDE.md or the pattern.
```

## Outcome and what I changed afterwards

Claude Code built the hybrid explanation pipeline and connected the service. Typecheck, lint, format:check and test pass (9 of 9). I checked the failure path with curl: LLM_PROVIDER=none gave fallback/disabled, a dead Ollama URL gave provider_error, a 1 ms timeout gave a true timeout, and with the defaults qwen2.5:3b returned source "llm" three times (4.8 s cold, about 1 s warm) with every sentence passing validation. Every case returned the same evidence sentence and wrote one log line. I accepted its choices: praise is matched as a substring, LLM_TIMEOUT_MS is validated at startup, and a student with no attempts returns a 404 that I did not test. Known limit: validation checks form and safety, not whether the model's advice is true, which is why the numbers are written by code.
