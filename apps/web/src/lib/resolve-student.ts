import { studentIdSchema } from "@coach/core";
import type { Config } from "./config";

/**
 * Only the demo switcher may pick the student from the query string. A real account would take the id from
 * the signed-in session, because an id in the URL lets anyone read anyone else's page.
 */
export function resolveStudentId(
	query: unknown,
	config: Pick<Config, "demoSwitcher" | "defaultStudentId">,
): string {
	if (!config.demoSwitcher) return config.defaultStudentId;

	const requested =
		typeof query === "object" && query !== null && "student_id" in query
			? query.student_id
			: undefined;
	const parsed = studentIdSchema.safeParse(requested);
	return parsed.success ? parsed.data : config.defaultStudentId;
}
