# CareerFlow AI

Phase 1 local product foundation for the Intelligent Career Operating System. The original cinematic landing page is preserved at `/`; the React/TypeScript application starts at `/app.html`.

## Run

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`. Run all current checks with `npm run check`.

## Current truth

- The public preview uses explicitly illustrative, deterministic sample logic.
- The authenticated-style workspace is a local demo. It stores the career profile and progress in browser `localStorage` and makes no network requests.
- Supabase, AI providers, email, live vacancies and billing are not connected.
- Do not enter real personal data until authenticated server persistence, privacy controls and production policies are configured and reviewed.

See [docs/SETUP.md](docs/SETUP.md), [docs/FEATURE_MATRIX.md](docs/FEATURE_MATRIX.md), and [docs/ROADMAP.md](docs/ROADMAP.md).

