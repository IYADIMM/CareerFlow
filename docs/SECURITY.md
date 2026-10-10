# Security model

## Implemented in this milestone

- Strict TypeScript and runtime validation for local persistence.
- No credentials, network calls, document uploads or payment collection.
- Explicit local-demo disclosure and user-controlled data deletion.
- Tenant-scoped PostgreSQL design with deny-by-default RLS enabled on foundation tables.
- Role checks derive from authenticated membership rows.
- Security headers are prepared in `netlify.toml`.

## Required before real users

- Configure Supabase Auth with verified email, secure recovery and short-lived sessions.
- Add authenticated server functions that perform object authorization and entitlement checks.
- Store documents only in private buckets; validate MIME signature and size; issue short signed URLs.
- Rate-limit authentication, document processing and AI endpoints.
- Encrypt provider secrets in the hosting environment and rotate them.
- Treat CV and vacancy text as quoted untrusted data, validate structured model output and log prompt-policy violations.
- Add webhook signature checks, timestamp tolerance and event-id uniqueness before billing activation.
- Add export/deletion jobs, retention policy, backups and restore tests.
- Obtain professional review of privacy, terms and regional employment/privacy obligations.

The presence of this document or SQL policies is not a compliance claim.

