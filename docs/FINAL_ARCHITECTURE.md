# Final architecture

CareerFlow currently has a static acquisition surface and a React 19/Vite application backed in local development by a loopback-only Node 24 HTTP service and SQLite. The server owns authentication, tenant selection, optimistic workspace revisions, agent state, approvals, audit events, exports, and destructive account operations. Client-supplied tenant identifiers are never authorization inputs.

The hosted target is a three-tier system: static/CDN frontend → server API/worker boundary → Supabase Auth, PostgreSQL, and private Storage. Browser clients use user sessions only. Candidate-data mutations, document parsing, AI calls, source retrieval, billing webhooks, and service-role operations stay server-side. The prepared migrations define owner-only career data and read-only direct client grants; membership alone is not candidate consent.

Agent packages separate policy, lifecycle, and tools. Runs persist an input snapshot and hash, bounded usage, checkpoints, exact draft hashes, expiring approvals, internal-only receipts, idempotency records, and audit history. There is no external job-application, email, billing, or document-publishing adapter.

Trust boundaries and remaining work:

- `LOCAL_SYNTHETIC_DEMO`: executed locally, synthetic data only.
- Hosted migrations: source-reviewed and statically tested, not executed against Supabase.
- Document originals: target private bucket and owner path policy are prepared; binary ingestion is not implemented.
- AI and live vacancy adapters: intentionally absent until provider/source approval and credentials exist.
- Staging/production: not provisioned; no URL is claimed.
