import { renderLayout } from "./layout";

export const renderHomePage = (): string =>
	renderLayout("Practice Coach", "<h1>Practice Coach</h1>\n<p>Coming soon.</p>");
