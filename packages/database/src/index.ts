import { readFileSync } from "node:fs";

const RAW_EXPORT_URL = new URL("../data/attempts.json", import.meta.url);

// Returns the export untouched. Validating and cleaning it is the API's job.
export const loadRawExport = (): unknown => {
	return JSON.parse(readFileSync(RAW_EXPORT_URL, "utf-8"));
};
