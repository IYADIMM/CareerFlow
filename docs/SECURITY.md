# Security model

## 2026-10-13 development implementation

The local API enforces session-derived tenants, salted scrypt passwords, HttpOnly SameSite cookies, CSRF and Origin checks, request size limits, revision checks and per-user/tenant idempotency. Login attempts are capped in memory; runs are capped in persisted storage. Paid AI budgets are zero and external actions are disabled. SQLite credentials and records are ignored by Git.

The unapplied Supabase migration now enables RLS on the skill catalog, scopes policies to authenticated owners with membership, freezes ownership columns using column grants, and removes browser membership mutation. Agency access stays closed until assignment and client consent are implemented. This follows the grants-plus-policies model in [Supabase's official RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security). Live PostgreSQL policy tests remain unexecuted.

Keep the development API on loopback: it has no TLS, email verification or password recovery, and SQLite is not encrypted at rest. Application audit APIs append events but a local database administrator can alter files. Clearing workspace records is not full account deletion.

## Implemented in this milestone

- Strict TypeScript and runtime validation for local persistence.
- No cloud credentials, external document uploads or payment collection. Local development API requests use same-origin cookies.
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
