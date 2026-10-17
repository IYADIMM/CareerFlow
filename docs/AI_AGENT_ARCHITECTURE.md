# AI agent architecture

The Opportunity Agent is a deterministic synthetic orchestration baseline, not a general autonomous applicant.

Flow: goal → plan → permitted fixture discovery → provenance/freshness validation → deduplication → deterministic evidence matching → evidence-only drafts → exact-hash approval → internal preparation receipt → verification and in-app follow-up.

Controls:

- Runs bind user, tenant, target, profile/target snapshot, revision, hash, expiry, and budget.
- Approvals bind exact draft hashes and expire after 30 minutes; any material input change forces a new run.
- Idempotency keys prevent duplicate mutations; terminal states stop further execution.
- Policy denies applications, email, outreach, purchases, ownership changes, publication, and sensitive sharing.
- Receipts mean only “recorded internally”; they never imply employer receipt.
- Tool calls, source decisions, rejected records, checkpoints, approvals, receipts, usage, and audit events remain reviewable.

The future provider layer must run server-side with structured output validation, prompt versions, trace IDs, timeouts, bounded retries, per-tenant quotas, cost records, redaction, and evaluation gates. External content never changes permissions. No provider is currently connected.
