# Local setup

## Prerequisites

- Node.js 24 or later (native TypeScript execution and SQLite)
- npm 10 or later

## Commands

```powershell
npm install
npm run dev
npm run check
```

Run `npm run dev:api` in one terminal and `npm run dev` in another. The API binds only to 127.0.0.1:8787; Vite proxies /api on 127.0.0.1:5173. The landing is `/`; Opportunity Agent is `/app.html#/agent`. No cloud credentials or paid APIs are needed. Create a synthetic local account and a new profile after signing in. Existing browser demo data is not automatically imported.

Sessions last eight hours, passwords require 12+ characters, and sign-out revokes the session. The database is `.local/careerflow.sqlite`; keep it out of source control and use synthetic data. Stop the API before copying this file for a development backup; restoration has not been validated for production.

## Optional services (not connected)

Copy `.env.example` to `.env.local` only when implementing the next milestone. A Supabase development project requires URL and anon key in the browser plus the service-role key only in server functions. AI and Stripe secrets must never use the `VITE_` prefix.

Free allowances, eligibility and limits change. Confirm current provider terms before provisioning. Add hard quotas and budget alerts before enabling paid model or billing traffic.
