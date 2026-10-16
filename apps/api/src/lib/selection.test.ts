import { describe, expect, it } from "vitest";
import type { CleanAttempt } from "@coach/core";
import { selectNextSkill } from "./selection";

const day = (n: number, hour = 10) =>
	`2026-08-${String(n).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00Z`;

let counter = 0;
const attempt = (
	studentId: string,
	skillId: string,
	isCorrect: boolean,
	submittedAt: string,
	hintUsed = false,
): CleanAttempt => ({
	attemptId: `att_${++counter}`,
	studentId,
	skillId,
	itemId: `item_${counter}`,
	isCorrect,
	hintUsed,
	secondsSpent: 30,
	submittedAt,
	afterExport: false,
});

// The service passes attempts oldest first, as cleanExport returns them.
const oldestFirst = (list: CleanAttempt[]) =>
	[...list].sort((a, b) => (a.submittedAt < b.submittedAt ? -1 : 1));

const skills = (...ids: string[]) => ids.map((id) => ({ skill_id: id, name: `Skill ${id}` }));

describe("selectNextSkill", () => {
	it("picks the lowest smoothed score and fills the evidence", () => {
		const list = oldestFirst([
			// a: 7 attempts, 1 correct, 3 hints -> 2/9. Last attempt on day 10.
			attempt("stu_1", "a", false, day(3), true),
			attempt("stu_1", "a", false, day(4)),
			attempt("stu_1", "a", true, day(5), true),
			attempt("stu_1", "a", false, day(6)),
			attempt("stu_1", "a", false, day(7)),
			attempt("stu_1", "a", false, day(8), true),
			attempt("stu_1", "a", false, day(10)),
			// b: 4 attempts, 3 correct -> 4/6. The student's latest attempt, day 15 at 09:00.
			attempt("stu_1", "b", true, day(9)),
			attempt("stu_1", "b", true, day(11)),
			attempt("stu_1", "b", false, day(13)),
			attempt("stu_1", "b", true, day(15, 9)),
			// c: 2 attempts, 1 correct -> 2/4.
			attempt("stu_1", "c", true, day(12)),
			attempt("stu_1", "c", false, day(13)),
			// Another student's weak skill must not be used.
			attempt("stu_2", "d", false, day(14)),
			attempt("stu_2", "d", false, day(14, 11)),
		]);

		const selection = selectNextSkill(list, skills("a", "b", "c", "d"), "stu_1");

		expect(selection).toMatchObject({ skillId: "a", skillName: "Skill a" });
		expect(selection?.score).toBeCloseTo(2 / 9);
		expect(selection?.evidence).toEqual({
			attempts: 7,
			correct: 1,
			hints: 3,
			// The last five of seven, oldest first.
			recentResults: [true, false, false, false, false],
			// Day 10 at 10:00 to day 15 at 09:00 is 4 days and 23 hours: whole days only.
			daysSinceLastAttempt: 4,
			thinEvidence: false,
		});
	});

	it("does not let a single correct attempt win, and flags thin evidence", () => {
		const wellObserved = oldestFirst([
			attempt("stu_1", "x", true, day(1)),
			...[false, false, true, false, false, true].map((ok, i) =>
				attempt("stu_1", "y", ok, day(2 + i)),
			),
		]);
		// x: 1 correct of 1 -> 2/3. y: 2 correct of 6 -> 3/8.
		expect(selectNextSkill(wellObserved, skills("x", "y"), "stu_1")).toMatchObject({
			skillId: "y",
			evidence: { thinEvidence: false },
		});

		const thin = oldestFirst([
			attempt("stu_1", "p", false, day(1)),
			...[true, true, true, true, false].map((ok, i) => attempt("stu_1", "q", ok, day(2 + i))),
		]);
		// p: 0 correct of 1 -> 1/3. q: 4 correct of 5 -> 5/7.
		expect(selectNextSkill(thin, skills("p", "q"), "stu_1")).toMatchObject({
			skillId: "p",
			evidence: { attempts: 1, thinEvidence: true },
		});
	});

	it("breaks ties by more attempts, then by skill id, and returns null without attempts", () => {
		// m: 1 of 2 -> 2/4. n: 2 of 4 -> 3/6. Same score, n has more attempts, though m sorts first.
		const moreAttempts = oldestFirst([
			attempt("stu_1", "m", true, day(1)),
			attempt("stu_1", "m", false, day(2)),
			attempt("stu_1", "n", true, day(3)),
			attempt("stu_1", "n", false, day(4)),
			attempt("stu_1", "n", true, day(5)),
			attempt("stu_1", "n", false, day(6)),
		]);
		expect(selectNextSkill(moreAttempts, skills("m", "n"), "stu_1")?.skillId).toBe("n");

		// Identical counts: the lower id wins even when it is listed last.
		const sameCounts = oldestFirst([
			attempt("stu_1", "q", false, day(1)),
			attempt("stu_1", "p", false, day(2)),
		]);
		expect(selectNextSkill(sameCounts, skills("q", "p"), "stu_1")?.skillId).toBe("p");

		expect(selectNextSkill(sameCounts, skills("q", "p"), "stu_none")).toBeNull();
	});
});
