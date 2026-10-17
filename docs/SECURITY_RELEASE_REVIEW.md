# Security release review

Decision: not approved for customer or public production use.

Verified locally: loopback/Host/Origin checks, JSON/body limits, salted scrypt passwords, HttpOnly SameSite sessions, expiry, CSRF for mutations, membership revalidation, personal-workspace owner enforcement, strict schemas, optimistic revision checks, safe reference URLs, agent deny-by-default, exact expiring approvals, idempotency, private no-store exports, account deletion, audit events, database restore integrity, and restored-session revocation.

Prepared but not verified: hosted owner-only RLS, read-only direct browser grants, server-mediated writes, and a private 10 MiB PDF/DOCX/TXT bucket rooted by user ID. These policies require execution and adversarial tests in an isolated Supabase project; static SQL tests are not a substitute.

Open launch blockers: hosted confirmation/recovery/refresh/recent-auth/MFA, service-role deployment boundary, private-object tests, malware-aware binary parsing, retention/legal approval, credential rotation drill, alerts, hosted backup/restore, dependency/security review in deployment, and professional penetration review proportionate to launch risk.

Secrets must live only in platform secret storage, be environment-scoped and rotated after suspected disclosure. Logs may include request/tenant/run identifiers, status, latency, usage, and redacted error class; never CV text, credentials, access tokens, document bytes, or raw provider prompts containing personal data.
