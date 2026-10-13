# Testing strategy

## 2026-10-13 agent milestone

Run `npm run check` (strict TypeScript, ESLint, Vitest and Vite production build) and `npm run eval:agent`. The suite contains repository, HTTP security, profile-persistence and React error-feedback tests. Repository cases cover two tenants, blocked external actions, draft-version approval, verified receipts, idempotency, expiry, pause/resume/cancel, consent and persistence after reopening SQLite.

Browser QA covered registration, profile saving, company consent, all agent checkpoints, approval, verified receipts, reload restoration, console inspection and 390px mobile navigation without horizontal overflow. Screenshots are in this docs folder. Browser-driven QA used the connected Playwright locator API; there is no independent headless Playwright runner yet.

The prepared Supabase pgTAP suite at `supabase/tests/foundation_rls.sql` remains unexecuted. No project, PostgreSQL runtime or CLI is configured. Accessibility was checked through labels, announced errors, focus styles, mobile navigation and overflow; no full WCAG certification or automated axe audit is claimed.

## Current checks

- `npm run typecheck`: strict TypeScript compilation.
- `npm test`: state validation, safe fallback and completeness unit tests.
- `npm run build`: production multi-page bundle.

## Before Supabase integration

Add authorization integration tests using two users in different organizations and assert cross-tenant reads/writes fail. Add React component tests for onboarding errors and data deletion. Add Playwright desktop/mobile coverage for the landing, local onboarding, navigation and reduced motion.

## Before production

Cover the 20 journeys in the master brief plus malformed uploads, expired sessions, idempotent webhooks, prompt-injection fixtures, keyboard navigation, axe checks, console errors and recovery from WebGL context loss.
