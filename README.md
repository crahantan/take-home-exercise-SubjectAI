# Practice Coach

"What should I practice next, and why?" for one student, built from a raw `attempts.json` export.

Work in progress. The full README (setup, assumptions, tradeoffs, next steps) comes later.

## Run

```
pnpm install
pnpm dev        # api on :3001, web on :3000
pnpm typecheck && pnpm lint && pnpm test
```

Every environment variable has a default, so `pnpm dev` works with no `.env`. There is no dotenv: to change a value, export it in your shell. `.env.example` lists each variable with its default.
