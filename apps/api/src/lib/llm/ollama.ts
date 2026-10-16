import { z } from "zod";
import type { ExplanationProvider, ProviderInput } from "@coach/core";

const chatResponseSchema = z.object({ message: z.object({ content: z.string() }) });

interface OllamaConfig {
	url: string;
	model: string;
}

export function createOllamaProvider({ url, model }: OllamaConfig): ExplanationProvider {
	return {
		name: "ollama",
		model,
		async generate({ system, user }: ProviderInput, signal: AbortSignal): Promise<unknown> {
			const response = await fetch(`${url}/api/chat`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				signal,
				body: JSON.stringify({
					model,
					messages: [
						{ role: "system", content: system },
						{ role: "user", content: user },
					],
					stream: false,
					format: {
						type: "object",
						properties: { message: { type: "string" } },
						required: ["message"],
					},
					options: { num_predict: 60, temperature: 0.3 },
					keep_alive: "30m",
				}),
			});
			if (!response.ok) throw new Error(`Ollama answered with status ${response.status}`);

			const body = chatResponseSchema.safeParse(await response.json());
			if (!body.success) throw new Error("Ollama answered with an unexpected body");

			// A reply cut by num_predict is not valid JSON, so it comes back as a string
			// and validation reports it as invalid_output.
			try {
				return JSON.parse(body.data.message.content);
			} catch {
				return body.data.message.content;
			}
		},
	};
}
