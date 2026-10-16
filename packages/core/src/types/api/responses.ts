import { z } from "zod";

/** Used by the api controllers to type what they send. */
export interface ApiResponse<T> {
	success: boolean;
	message?: string | undefined;
	data: T;
	error?: unknown | undefined;
}

/** Used by the web client to check a response at runtime. Parsing narrows the result on `success`. */
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
	z.discriminatedUnion("success", [
		z.object({
			success: z.literal(true),
			message: z.string().optional(),
			data: dataSchema,
		}),
		z.object({
			success: z.literal(false),
			message: z.string().optional(),
			data: z.null(),
			error: z.unknown(),
		}),
	]);
