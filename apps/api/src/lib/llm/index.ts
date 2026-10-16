import { readFileSync } from "node:fs";
import type { ExplanationProvider } from "@coach/core";
import { createOllamaProvider } from "./ollama";

const PROMPT_FILE = "motivation.v1.txt";

/** The version comes from the filename, so changing the prompt means a new file and a new version in the logs. */
export function loadPrompt(): { version: string; text: string } {
	const version = /\.(v\d+)\.txt$/.exec(PROMPT_FILE)?.[1];
	if (!version) throw new Error(`Prompt file name "${PROMPT_FILE}" has no version`);
	const text = readFileSync(new URL(`./prompts/${PROMPT_FILE}`, import.meta.url), "utf-8").trim();
	return { version, text };
}

/** Adding a provider means implementing the contract in this folder and registering it here. */
export function createProvider(): ExplanationProvider | null {
	const name = process.env.LLM_PROVIDER || "ollama";

	if (name === "none") return null;
	if (name === "ollama") {
		return createOllamaProvider({
			url: process.env.OLLAMA_URL || "http://localhost:11434",
			model: process.env.OLLAMA_MODEL || "qwen2.5:3b",
		});
	}
	throw new Error(`Unknown LLM_PROVIDER "${name}". Use "ollama" or "none".`);
}

/** A bad value stops the api at startup, like an unknown provider, instead of silently using the default. */
export function getLlmTimeoutMs(): number {
	const raw = process.env.LLM_TIMEOUT_MS || "6000";
	const timeoutMs = Number(raw);
	if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
		throw new Error(
			`LLM_TIMEOUT_MS must be a positive whole number of milliseconds, got "${raw}".`,
		);
	}
	return timeoutMs;
}
