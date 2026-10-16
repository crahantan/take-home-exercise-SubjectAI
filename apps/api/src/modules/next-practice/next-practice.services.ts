import { AppError } from "../../lib/app-error";

// Stub: selection and explanation are not written yet.
export const getNextPractice = async (): Promise<never> => {
	throw new AppError(501, "NOT_IMPLEMENTED", "Next practice is not implemented yet");
};
