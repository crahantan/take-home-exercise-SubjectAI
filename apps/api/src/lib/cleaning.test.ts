import { describe, expect, it } from "vitest";
import { cleanExport } from "./cleaning";

const attempt = (overrides: Record<string, unknown> = {}) => ({
	attempt_id: "att_1",
	student_id: "stu_1",
	skill_id: "skill_a",
	item_id: "item_1",
	is_correct: true,
	hint_used: false,
	seconds_spent: 30,
	submitted_at: "2026-08-10T10:00:00Z",
	...overrides,
});

const exportOf = (attempts: unknown[]) => ({
	exported_at: "2026-08-21T00:00:00Z",
	skills: [{ skill_id: "skill_a", name: "Skill A" }],
	students: [{ student_id: "stu_1", first_name: "Ana" }],
	attempts,
});

describe("cleanExport", () => {
	it("drops a repeated attempt_id but keeps the same item_id on a different date", () => {
		const { attempts, report } = cleanExport(
			exportOf([
				attempt({ attempt_id: "att_1" }),
				attempt({ attempt_id: "att_1", is_correct: false }),
				attempt({ attempt_id: "att_2", submitted_at: "2026-08-12T10:00:00Z" }),
			]),
		);

		expect(attempts.map((a) => a.attemptId)).toEqual(["att_1", "att_2"]);
		expect(attempts[0]?.isCorrect).toBe(true);
		expect(report.rules.duplicate_attempt_id).toBe(1);
		expect(report).toMatchObject({ rawCount: 3, cleanCount: 2 });
	});

	it("keeps null and extreme seconds attempts with secondsSpent null, and counts them", () => {
		const { attempts, report } = cleanExport(
			exportOf([
				attempt({ attempt_id: "att_1", seconds_spent: null }),
				attempt({ attempt_id: "att_2", seconds_spent: 6 }),
				attempt({ attempt_id: "att_3", seconds_spent: 4211 }),
				attempt({ attempt_id: "att_4", seconds_spent: 45 }),
			]),
		);

		expect(attempts.map((a) => a.secondsSpent)).toEqual([null, null, null, 45]);
		expect(report.rules.missing_seconds).toBe(1);
		expect(report.rules.extreme_seconds).toBe(2);
		expect(report.cleanCount).toBe(4);
	});

	it("drops malformed rows and unknown ids without throwing, and flags after_export without dropping", () => {
		const { attempts, report } = cleanExport(
			exportOf([
				attempt({ attempt_id: "att_1", is_correct: "yes" }),
				attempt({ attempt_id: "att_2", submitted_at: "not-a-date" }),
				attempt({ attempt_id: "att_3", skill_id: "skill_zzz" }),
				attempt({ attempt_id: "att_4", student_id: "stu_999" }),
				attempt({ attempt_id: "att_5", submitted_at: "2026-08-22T10:00:00Z" }),
			]),
		);

		expect(attempts).toHaveLength(1);
		expect(attempts[0]).toMatchObject({
			attemptId: "att_5",
			submittedAt: "2026-08-22T10:00:00Z",
			afterExport: true,
		});
		expect(report.rules).toMatchObject({
			malformed_row: 2,
			unknown_skill: 1,
			unknown_student: 1,
			after_export: 1,
		});
	});
});
