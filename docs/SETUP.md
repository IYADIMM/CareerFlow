# Local setup

## Prerequisites

- Node.js 22 or later
- npm 10 or later

## Commands

```powershell
npm install
npm run dev
npm run check
```

The landing page is `/`; the application is `/app.html#/welcome`. No environment variables are needed for local mode.

## Optional services (not connected)

Copy `.env.example` to `.env.local` only when implementing the next milestone. A Supabase development project requires URL and anon key in the browser plus the service-role key only in server functions. AI and Stripe secrets must never use the `VITE_` prefix.

Free allowances, eligibility and limits change. Confirm current provider terms before provisioning. Add hard quotas and budget alerts before enabling paid model or billing traffic.

