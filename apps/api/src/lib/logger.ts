type LogFields = Record<string, unknown>;

const write = (level: "info" | "error", fields: LogFields) => {
	console.log(JSON.stringify({ level, time: new Date().toISOString(), ...fields }));
};

export const logger = {
	info: (fields: LogFields) => write("info", fields),
	error: (fields: LogFields) => write("error", fields),
};
