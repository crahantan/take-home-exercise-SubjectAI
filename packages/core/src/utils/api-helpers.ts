import type { ApiError, ApiFailure, ApiSuccess } from "../types/api/responses";

export const ResponseUtil = {
	success<T>(data: T, message?: string): ApiSuccess<T> {
		return message === undefined ? { success: true, data } : { success: true, message, data };
	},

	error(message: string, error: ApiError): ApiFailure {
		return { success: false, message, data: null, error };
	},
};
