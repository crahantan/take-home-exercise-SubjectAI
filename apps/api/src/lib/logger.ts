type Fields = Record<string, unknown>;

// One JSON object per line, so a log aggregator can parse it without a custom format.
const write = (level: "info" | "error", message: string, fields: Fields): void => {
	const line = JSON.stringify({ level, time: new Date().toISOString(), message, ...fields });
	(level === "error" ? console.error : console.log)(line);
};

export const logger = {
	info: (message: string, fields: Fields = {}): void => write("info", message, fields),
	error: (message: string, fields: Fields = {}): void => write("error", message, fields),
};
