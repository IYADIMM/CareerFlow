# Development log

## 2026-10-13 — Opportunity Agent development milestone

- Verified remote main HEAD c9eb54b; created local feat/opportunity-agent branch based on that history.
- Fresh baseline passed strict TypeScript, 3 original tests and the production build.
- Fixed profile/skill identity and evidence loss on edits.
- Corrected the unapplied Supabase RLS/grant model; prepared a SQL regression suite. No Supabase project exists in the connected account.
- Added local authenticated tenant-isolated SQLite persistence and CSRF/Origin protections.
- Added reusable agent-core, agent-tools, agent-policy and agent-evals boundaries.
- Implemented fixture discovery, provenance/freshness checks, repost detection, evidence drafting, approval hashes, persisted receipts and follow-ups.
- Browser-tested synthetic registration, saved profile, target consent, run completion and reload persistence. Checked desktop and 390px mobile navigation/overflow; console reported no warnings/errors at capture.
- Removed two obsolete generated Vite config artifacts that shadowed the source config.
- No external actions, paid services, publication or main merge performed.
- Final verification: strict TypeScript and ESLint passed; 15 tests across 4 files passed; production UI build passed (189 modules); runtime dependency audit reported no known vulnerabilities.

## 2026-10-10 — Milestone 1 foundation

- Audited the supplied landing page and preserved all three source assets.
- Added factual commercial pricing hypotheses and routes into the local product.
- Created a Vite/React/TypeScript multi-page application and responsive design system.
- Implemented validated browser persistence, career foundation editing, progress, smart actions, journey map and deletion.
- Added tenant-ready SQL, RLS policy foundations, security documentation and service placeholders.
- Added unit tests and production build scripts.
- Verified strict TypeScript with `pnpm run typecheck` (pass).
- Verified `pnpm run test` (1 file, 3 tests passed).
- Verified `pnpm run build` (185 modules; landing and application entry points emitted).
- Browser-tested synthetic profile creation through the persisted command center; no console warnings or errors were reported.

Deliberately deferred real authentication, AI, billing, file uploads and external integrations because no development credentials or provider approvals were supplied.
