# Opportunity Agent — development milestone, 2026-10-13

CareerFlow helps professionals compare opportunities against declared experience, spot seniority risks and prepare truthful application material. Coaches can eventually supervise the evidence model with explicit client consent.

## Reproducible demo

Use Node 24 (native TypeScript execution and SQLite). Run npm run dev:api and npm run dev in separate terminals. Open /app.html#/agent, create a synthetic local account, save a profile, select fixture companies and roles, and save consent. Create a run and advance it through planning and discovery. Review every draft, approve its exact hash, record preparation, and verify receipts. Reload to confirm persistence.

The sources are four synthetic vacancies: a director role, its repost, a lower-level assistant role, and a stale vacancy. Fixture URLs end in .example.invalid; they cannot be counted as live verified URLs.

## Architecture and policy

- packages/agent-core: typed lifecycle, tool contracts, bounded read retries, usage and budget contracts.
- packages/agent-tools: CareerFlow-specific source, provenance, freshness, deduplication, requirement extraction and evidence-only drafting.
- packages/agent-policy: deterministic tenant authorization and approval checks; external action adapters disabled.
- packages/agent-evals: fixed date, labeled fixture dataset, repeatable extraction and injection measurements.
- server/: loopback API and SQLite repository, sessions, consented targets, run checkpoints, approval hashes, unique receipts, follow-ups and append-only API audit events.

The infrastructure has no CategoryFlow dependency or shared database. CategoryFlow must supply its own domain adapters and persistence deployment.

## Persistence and security

Users receive personal tenants with trusted membership rows. The browser cannot select a tenant for API commands. Session tokens are stored as SHA-256 digests; passwords use salted scrypt; cookies are HttpOnly and SameSite=Strict. Mutations require an allowed Origin and a session-bound CSRF value. State saves use revision checks. Agent commands use per-user/tenant idempotency keys. Daily runs are capped at 20 and paid model budget is zero.

Development cookies are HTTP loopback cookies. Production requires TLS/Secure cookies, hosted identity, verified email, recovery, distributed rate limits, retention/export/deletion controls and independent security review. Local SQLite is not encrypted at rest.

## What execution means

The authorized action in this milestone is an internal preparation record. A verified receipt means the database contains that approved draft hash and run association. It does not mean an employer received an application. Follow-ups are stored in-app review dates, not scheduled background messages.

## Measured fixture outcomes

node packages/agent-evals/run.ts measures 4 labeled records, 3 fresh records accepted, 1 stale rejected, 1 repost duplicate, and 2 unique fresh opportunities. Requirement extraction matches 4/4 fixture labels (100% on this very small synthetic set). The injected-qualification fixture produces 0 fabricated claims. Authorization tests reject all four external action categories and cross-tenant run access.

Live verified URL rate and time savings are unmeasured. Targets of 95% URL verification, 95% extraction and 60% savings remain targets. A broader real-world labeled dataset and timed manual baseline are required.

## Competition evidence and video plan

Eligibility is unverified because no competition name or official rules were supplied. Before claiming readiness, record the organizer's official URL, deadline/timezone, eligibility, IP/data rules, hosting requirements and judging rubric.

Suggested three-minute recording: problem and beneficiary (20s), saved career facts and consent (30s), fixture discovery/deduplication/freshness (40s), review seniority and evidence draft (40s), approval/receipts/reload/audit (35s), evaluation limits and next integration (15s).

Presentation outline: problem, workflow, architecture, security, measured evidence, pilot plan.

## Pilot boundaries

This is a reproducible local development demo. Real customer onboarding awaits hosted authentication, database authorization tests and data lifecycle controls. Human-managed paid service can be validated with a defined scope and manual delivery, but no invoice, payment or revenue is claimed here.
