import type { ApiResponse } from "../types/api/responses";

export const ResponseUtil = {
	success: <T>(data: T, message?: string): ApiResponse<T> => ({
		success: true,
		message,
		data,
	}),
	error: (error: unknown, message?: string): ApiResponse<null> => ({
		success: false,
		message,
		data: null,
		error,
	}),
};
