import { studentIdSchema } from "@coach/core";

export interface Config {
	port: number;
	apiUrl: string;
	apiTimeoutMs: number;
	demoSwitcher: boolean;
	defaultStudentId: string;
}

type Env = Record<string, string | undefined>;

const readPositiveInt = (env: Env, name: string, fallback: string): number => {
	const raw = env[name] || fallback;
	const value = Number(raw);
	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(`${name} must be a positive whole number, got "${raw}".`);
	}
	return value;
};

/** An invalid value throws, so the server stops at startup instead of running on a wrong setting. */
export function loadConfig(env: Env = process.env): Config {
	const port = readPositiveInt(env, "PORT", "3000");
	if (port > 65535) throw new Error(`PORT must be at most 65535, got "${port}".`);

	const apiUrlRaw = env.API_URL || "http://localhost:3001";
	let apiUrl: URL;
	try {
		apiUrl = new URL(apiUrlRaw);
	} catch {
		throw new Error(`API_URL must be an http(s) URL, got "${apiUrlRaw}".`);
	}
	if (apiUrl.protocol !== "http:" && apiUrl.protocol !== "https:") {
		throw new Error(`API_URL must be an http(s) URL, got "${apiUrlRaw}".`);
	}

	// Longer than the api's LLM timeout (6000 ms by default), or the web gives up before the api can fall back.
	const apiTimeoutMs = readPositiveInt(env, "WEB_API_TIMEOUT_MS", "8000");

	const demoSwitcherRaw = env.DEMO_STUDENT_SWITCHER || "on";
	if (demoSwitcherRaw !== "on" && demoSwitcherRaw !== "off") {
		throw new Error(`DEMO_STUDENT_SWITCHER must be "on" or "off", got "${demoSwitcherRaw}".`);
	}

	const defaultStudentRaw = env.DEFAULT_STUDENT_ID || "stu_1041";
	const defaultStudent = studentIdSchema.safeParse(defaultStudentRaw);
	if (!defaultStudent.success) {
		throw new Error(`DEFAULT_STUDENT_ID must look like stu_1041, got "${defaultStudentRaw}".`);
	}

	return {
		port,
		apiUrl: apiUrl.href.replace(/\/+$/, ""),
		apiTimeoutMs,
		demoSwitcher: demoSwitcherRaw === "on",
		defaultStudentId: defaultStudent.data,
	};
}
