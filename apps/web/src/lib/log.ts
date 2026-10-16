/** One JSON object per line, like the api, so both can go to the same log tool. */
export const log = (fields: Record<string, unknown>): void => {
	console.log(JSON.stringify({ level: "info", time: new Date().toISOString(), ...fields }));
};
