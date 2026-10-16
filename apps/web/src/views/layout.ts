import { escapeHtml } from "../lib/escape-html";
import { STYLES } from "../lib/styles";

interface LayoutParams {
	title: string;
	/** Already-built HTML. Every dynamic string inside it must have gone through escapeHtml. */
	body: string;
}

export const renderLayout = ({ title, body }: LayoutParams): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;
