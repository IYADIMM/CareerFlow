# Final test evidence

Environment: Windows local workspace, Node 24-compatible bundled runtime, pnpm lockfile, loopback HTTP tests, synthetic data. Date: 17 October 2026.

Baseline before this branch: `pnpm check` passed 27 tests across 5 files after granting loopback access; typecheck, lint, and production build passed. `pnpm eval:agent` passed its four-record synthetic fixture cohort.

Final evidence after the last functional source change:

- `pnpm check`: passed. Strict typecheck, ESLint, 32 tests across 6 files, and Vite production build (195 modules) passed.
- `pnpm eval:agent`: passed the four-record labeled synthetic cohort: 3 fresh accepted, 1 stale rejected, 2 unique, 1 duplicate, 100% exact extraction in the tiny controlled vocabulary, 0 fabricated qualifications. Live URL/time-saving values remain `null`.
- `pnpm audit --prod`: passed; no known vulnerabilities reported by the registry audit.
- Hosted pgTAP/RLS/Security Advisor: not run; no Supabase project exists.
- Staging E2E/auth/private document test: not run; no staging exists.
- Local restore drill: automated populated SQLite backup/restore test included.
- Current-branch browser check: settings rendered at default and 390 px; no horizontal overflow. The first 390 px measurement found 14/36 px controls, which were corrected and remeasured at 44 px.

An initial sandboxed HTTP run failed only because the sandbox denied a temporary `127.0.0.1` connection (`EACCES`); the same gate passed outside that restriction. This is environment evidence, not a product defect.
