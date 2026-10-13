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

## Current truth

- The public preview uses explicitly illustrative, deterministic sample logic.
- Browser demo mode stores state in localStorage. Signing in switches the application to a personal tenant in the loopback SQLite development API.
- The Opportunity Agent uses synthetic fixture vacancies and deterministic tools. It persists checkpoints, consent, draft approval, verified preparation receipts and review follow-ups.
- Supabase, AI providers, email, live vacancies and billing are not connected.
- Do not enter real personal data until authenticated server persistence, privacy controls and production policies are configured and reviewed.

Run `npm run check` for strict types, regression tests and the production UI build. Run `npm run eval:agent` for fixture measurements. The database under `.local/` is ignored by Git.

See [Agent dossier](docs/AGENT_DOSSIER.md), [setup](docs/SETUP.md), [feature matrix](docs/FEATURE_MATRIX.md), and [roadmap](docs/ROADMAP.md).
