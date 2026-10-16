import { escapeHtml } from "../lib/escape-html";

const STYLES = `
body{margin:0;font-family:system-ui,sans-serif;line-height:1.5;color:#1b1b1f;background:#f6f6f9}
main{max-width:36rem;margin:0 auto;padding:2rem 1rem}
`;

export const renderLayout = (title: string, body: string): string => `<!doctype html>
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
