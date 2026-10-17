# CareerFlow AI

CareerFlow's cinematic public page is preserved at `/`. The React application includes a browser demo and an authenticated local Opportunity Agent at `/app.html#/agent`.

## Run

```powershell
npm install
npm run dev:api
```

Use Node 24+. Start the UI in another terminal:

```powershell
npm run dev
```

Open `http://127.0.0.1:5173/`. Run all current checks with `npm run check`.

If npm is unavailable but the bundled Node runtime and dependencies are present, use `node server/index.ts` and `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173` in separate terminals.

## Current truth

- The public preview uses explicitly illustrative, deterministic sample logic.
- Browser demo mode stores state in localStorage. Signing in switches the application to a personal tenant in the loopback SQLite development API.
- The Opportunity Agent uses synthetic fixture vacancies and deterministic tools. It persists checkpoints, consent, draft approval, verified preparation receipts and review follow-ups.
- Signed-in local users can export a portable JSON copy and permanently delete their complete development account from Settings.
- The hosted Core MVP schema, owner-only RLS design and private document bucket are prepared and statically guarded, but have not been applied to a Supabase project.
- Supabase, AI providers, email, live vacancies and billing are not connected.
- Do not enter real personal data until authenticated server persistence, privacy controls and production policies are configured and reviewed.

Run `npm run check` for strict types, regression tests and the production UI build. Run `npm run eval:agent` for fixture measurements. The database under `.local/` is ignored by Git.

See the [master requirements ledger](docs/MASTER_REQUIREMENTS_LEDGER.md), [final release status](docs/FINAL_RELEASE_STATUS.md), [setup](docs/SETUP.md), and [owner actions](docs/FINAL_OWNER_ACTIONS.md).
