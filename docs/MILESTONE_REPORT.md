# CareerFlow Opportunity Agent — milestone report

Date: 2026-10-13. Local branch: feat/opportunity-agent, based on GitHub main c9eb54b. No push, main merge, hosted deployment, employer contact or paid service activation performed.

## A. Implemented

An authenticated development workspace and persisted Opportunity Agent with GOAL → PLAN → TOOLS → APPROVAL → EXECUTE → VERIFY. Includes consented profile/targets, fixture company radar, provenance/freshness checks, duplicate/repost detection, labeled requirement extraction, explainable fit/gaps/seniority, same-currency compensation comparison, truthful profile-based draft, approval of exact draft hashes, internal preparation receipts, verified outcomes and in-app follow-up dates.

Runs support created, planning, ready, executing, verifying, awaiting approval, paused, failed, cancelled, expired and completed. Read retries are bounded; paid model budgets are zero; external side-effect tools are blocked. Checkpoints, usage, approvals, audit, idempotency and outcomes persist in SQLite.

Fixed profile ID regeneration and skill-evidence loss on edits, serialized authenticated saves and stale-write detection, session hydration, hidden mobile-navigation focus, and obsolete generated Vite config shadowing. Finished local CV text review, manual vacancy/match/application screens and persisted interview notes from the interrupted milestone.

## B. Files changed

Main additions: packages/agent-core/index.ts, packages/agent-tools/careerflow.ts, packages/agent-policy/index.ts, packages/agent-evals/run.ts; server/store.ts and server/index.ts; src/AgentPage.tsx, src/lib/api.ts, src/lib/intelligence.ts and src/workflows.css; repository/API/component tests; Supabase regression SQL; dossier, pilot plan and screenshots.

Modified app routing, profile/workspace types and storage, Vite proxy, Node requirements, lint/check scripts, dependency lockfile, RLS migration and living documentation. Removed two regenerable, ignored Vite configuration outputs; editable vite.config.ts remains the source. Normalized source line endings relative to the initial GitHub API upload.

## C. Database

SQLite tables: users, organizations, memberships, sessions, workspaces, target_radar, agent_runs, agent_checkpoints, approvals, action_receipts, follow_ups, audit_events and idempotency. Mutations are tenant-derived, parameterized and transactional; receipt/checkpoint/idempotency keys are unique.

Supabase migration is corrected but unapplied: catalog RLS, authenticated-owner policies, membership checks, immutable ownership columns and closed agency access. Prepared pgTAP suite was not executed: the connected Supabase account has no projects, and no PostgreSQL/CLI runtime is available.

## D. Testing

Fresh baseline: TypeScript, original 3 tests and Vite build passed.

Final actual commands:

- node node_modules/typescript/bin/tsc -b --pretty false — passed.
- node node_modules/eslint/bin/eslint.js src server packages tests — passed.
- node node_modules/vitest/vitest.mjs run — 4 files, 14 tests passed.
- node node_modules/vite/bin/vite.js build — passed, 189 modules.
- node packages/agent-evals/run.ts — 4 synthetic labels matched exactly; 1 stale vacancy rejected; 1 duplicate skipped; 0 injected qualifications copied into the draft.
- pnpm audit --prod through the bundled executable — no known runtime vulnerabilities reported.

API integration tests require loopback access. The initial sandbox blocked localhost fetch; rerunning with reviewed permission passed. A test cleanup failure was fixed before the final run. Vite reports two harmless upstream Zod comment-annotation warnings.

## E. UI/UX

Original cinematic public assets remain. The agent screen adds visible lifecycle status, exact-version approval, evidence/gaps, accessible consent/target inputs, loading/error feedback and audit history. Browser-driven checks completed synthetic signup, persisted profile, consented radar, discovery, review, approval, receipt verification and reload restoration. At 390px, mobile navigation opens/closes and the page has no horizontal overflow. Browser console capture reported no warnings or errors.

Screenshots: agent-desktop.png, agent-mobile.png and agent-verified.png. This is focused accessibility QA; a full automated axe/WCAG audit remains outstanding.

## F. Security

Server derives tenant and role from stored membership linked to an unexpired session. Passwords use salted scrypt; session tokens are hashed; cookies are HttpOnly/SameSite; mutating requests require Origin and CSRF checks. Request sizes, authentication attempts, daily runs and paid budgets are limited. Revision checks and per-user/tenant idempotency prevent accidental duplicate writes. Approval hashes bind review to generated drafts. External action categories are denied.

The server is development-only and loopback-bound. Production requires hosted auth, TLS/Secure cookies, email verification/recovery, stronger distributed limits, complete export/deletion/retention, live RLS tests and recovery validation. SQLite is not encrypted at rest. Agency access is intentionally closed until assignments and client consent exist.

## G. External dependencies

Node 24 and existing open-source frontend/test tools. Added pinned ESLint/TypeScript lint packages; runtime SQLite is built into Node. Hosted Supabase/auth, permitted live job sources, AI providers, email, production payments and competition rules remain unconfigured. CategoryFlow is independent; no data or credentials were accessed from it or QuoteFlow.

## H. Costs

This milestone uses local tools and deterministic processing with a zero paid-model budget. No paid resource was created and no charge, purchase or live payment occurred.

## I. Limitations

Synthetic URLs are not live-verified vacancies. The four-row fixture extraction result is not evidence of 95% real-world accuracy. Time savings remain unmeasured. Drafts use saved candidate profile statements; full employer/date/achievement chronology, PDF/DOCX ingestion and export are pending. Verification proves internal preparation records, not employer submissions. Follow-ups are in-app dates, not background delivery. Payments, organization switching, agency clients and full account deletion remain incomplete. Competition eligibility cannot be determined without official rules and deadlines.

## J. Next milestone

1. Connect an isolated Supabase development project and execute RLS tests/advisors.
2. Replace local identity/persistence with hosted auth, email recovery and repository parity tests.
3. Implement private CV files, verified chronology, document versioning and export.
4. Add a permitted live vacancy adapter with source/freshness evidence.
5. Expand the labeled evaluation dataset and establish a timed manual baseline.
6. Complete privacy/data lifecycle and server entitlements for a founder-operated pilot.
7. Verify the named competition's official requirements before preparing an entry.
