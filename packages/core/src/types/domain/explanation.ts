import { z } from "zod";

export interface ProviderInput {
	system: string;
	user: string;
}

/** A provider returns `unknown` on purpose: nothing it returns is trusted until it is validated. */
export interface ExplanationProvider {
	readonly name: string;
	readonly model: string;
	generate(input: ProviderInput, signal: AbortSignal): Promise<unknown>;
}

export const modelOutputSchema = z.object({ message: z.string() }).strict();
