# 11. Give the student a way to start

- Tool: Claude Code, run from the repo root with `CLAUDE.md` and `.claude/module-pattern.md` in place
- Date: 2026-10-16
- Purpose: rereading the brief I found that the screen must "give the student a way to start", and in prompt 09 I had decided on no call-to-action button because there is no second screen. That decision contradicted the brief, so I am reversing it. The practice questions are out of scope and a second screen is forbidden, so the button opens a short, honest note on the same page. In the real app it would be a link to the platform's practice for that skill.

## Prompt

```
Read CLAUDE.md first. Task: add a "Start practicing" button to the practice page, and nothing else. Do not run any git command that changes state. Do not touch docs/ or README.md. Do not change apps/api or packages/core. Add no dependency.

1. apps/web/src/views/practice-page.ts: right under the explanation card, before the "See how you did" details, add a link styled as a large primary button: <a class="start" href="#start">Start practicing</a>. After it, add <section id="start" class="start-note" role="note"> with the text `Practice questions are not part of this exercise. In the real app this opens your first question on ${skillName}.` The skill name goes through escapeHtml like every dynamic string. No JavaScript.
2. apps/web/src/lib/styles.ts: style .start as the primary action (full width on a phone, at least 44 px tall, contrast of at least 4.5:1, a visible :focus-visible outline). Hide the note by default and show it only when it is the target: .start-note { display: none } and .start-note:target { display: block }. Keep the CSS under about 2.5 KB in total.
3. The fallback page gets no button, because it has no recommendation to start.
4. In the existing views test block (do not add a new block), add assertions that the practice page contains href="#start" and the note text, that a hostile skillName such as <script>alert(1)</script> is escaped inside the note, and that the fallback page does not contain "Start practicing".
5. CLAUDE.md: in Product rules replace the "no call-to-action button" rule with: the screen has a "Start practicing" button that opens an in-page note, because practice content is out of scope and a second screen is forbidden; the real app would link to the platform's practice for the skill. Check the rest of CLAUDE.md for other mentions of the old rule.
6. Verify: pnpm typecheck, lint, format:check and test pass. Start pnpm dev, curl GET / and show the button and the note markup, print the page size to confirm it is under 14 KB, and confirm grep -c "<script" finds 0.

Report the files you changed and every deviation from CLAUDE.md.
```

## Outcome and what I changed afterwards

Claude Code added the "Start practicing" button under the suggestion card, with an in-page note that appears with the CSS :target selector and no JavaScript. The practice page is 3.8 KB with no script tag, and typecheck, lint, format:check and test pass (api 9, web 2). Tests extend the existing views block: the button and note exist, a hostile skill name is escaped inside the note, and the fallback page has no button. I reversed my decision from prompt 09 because the brief requires a way to start. Known limits: the note is hidden from screen readers until it opens, and I still have to click the button in a real browser to confirm the note appears.
