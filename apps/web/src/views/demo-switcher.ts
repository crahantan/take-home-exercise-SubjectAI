import { DEMO_STUDENTS } from "../lib/demo-students";
import { escapeHtml } from "../lib/escape-html";

/** Demo aid only. A plain GET form, so it needs no JavaScript. */
export const renderDemoSwitcher = (currentStudentId: string): string => {
	const options = DEMO_STUDENTS.map(
		({ id, firstName }) =>
			`<option value="${escapeHtml(id)}"${id === currentStudentId ? " selected" : ""}>${escapeHtml(firstName)}</option>`,
	).join("");

	return `<form method="get" action="/">
<label for="student">Demo only: view as</label>
<select id="student" name="student_id">${options}</select>
<button type="submit">Show</button>
</form>`;
};
