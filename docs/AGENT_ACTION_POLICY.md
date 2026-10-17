# Agent action policy

The Opportunity Agent is deny-by-default. It may read an explicitly consented profile snapshot and synthetic target configuration, call typed fixture read tools, produce evidence-limited drafts, record approved internal preparation and verify database receipts.

Approval binds the authenticated user and tenant, input snapshot, exact draft hashes and a 30-minute expiry. The executor rechecks current membership, input equality, hashes, budget and approval at execution. Material profile, target or draft changes require a new run. Reads have bounded transient retries; side effects never auto-retry. Idempotency prevents duplicate commands.

Employer submissions, emails, recruiter outreach, purchases, account changes, platform ownership changes and live source access are disabled. Vacancy/CV/web content is untrusted and cannot change permissions, approve work or reveal secrets. A source failure creates no vacancy. A completed fixture run can create one `saved` application record; it never records submission.

Future external actions require an approved adapter, exact destination and payload, scoped consent, expiry, reconciliation of uncertain outcomes and independent security/integration tests.
