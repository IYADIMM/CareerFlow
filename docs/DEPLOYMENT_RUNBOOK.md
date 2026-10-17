# Deployment runbook

No staging environment or URL currently exists. This is the exact controlled path; it must be performed with synthetic records first.

1. Owner creates or authorizes an isolated Supabase staging project and records its project reference, region, Auth URL, and approved email provider/domain.
2. Configure separate frontend/backend staging services, HTTPS, secret storage, and only staging credentials. Keep the service-role key server-only.
3. Apply `202610100001_foundation.sql`, then `202610170002_core_mvp.sql` with migration tooling. Never import the local SQLite database.
4. Run `supabase/tests/foundation_rls.sql`, add Core MVP two-tenant/private-object pgTAP cases, and save raw results. Run Database Linter/Security Advisor and resolve findings.
5. Create two synthetic confirmed users and tenants. Test signup, confirmation, login/logout, reset/recovery, refresh/expiry, revocation, wrong-tenant reads/writes, forged owner/organization fields, membership escalation, and private object access.
6. Configure server-mediated document upload/parser and verify PDF/DOCX/TXT signatures, limits, extraction, quarantine/error handling, private download, versioning, deletion, and backup.
7. Deploy the immutable source commit. Run `/api/health`, all automated gates, customer-journey acceptance, responsive/accessibility tests, and restore drill. Record URL and commit only after success.
8. Roll back application by redeploying the prior immutable commit. Roll back schema only with a reviewed forward recovery migration; never destructively reverse a migration against customer data.
9. Promotion to production requires owner approval, separate production project/secrets, reviewed legal/retention controls, monitoring/alerts/on-call ownership, backup evidence, and a production smoke test. Never copy staging users or personal data.

Current configuration (`netlify.toml`) is a build artifact, not proof of a deployment.
