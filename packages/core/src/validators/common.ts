import { z } from "zod";

/** Student ids in the export look like `stu_1041`. A closed pattern keeps arbitrary text out of the service. */
export const studentIdSchema = z
	.string()
	.trim()
	.regex(/^stu_\d+$/, { message: "student_id must look like stu_1041" });
