# Testing strategy

## Current checks

- `npm run typecheck`: strict TypeScript compilation.
- `npm test`: state validation, safe fallback and completeness unit tests.
- `npm run build`: production multi-page bundle.

## Before Supabase integration

Add authorization integration tests using two users in different organizations and assert cross-tenant reads/writes fail. Add React component tests for onboarding errors and data deletion. Add Playwright desktop/mobile coverage for the landing, local onboarding, navigation and reduced motion.

## Before production

Cover the 20 journeys in the master brief plus malformed uploads, expired sessions, idempotent webhooks, prompt-injection fixtures, keyboard navigation, axe checks, console errors and recovery from WebGL context loss.

