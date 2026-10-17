# Feature acceptance matrix

Evidence date: 17 October 2026. Environment: local loopback, synthetic data, SQLite.

| Capability | Outcome | UI | Data and authorization | Integration | Happy / failure evidence | Status |
|---|---|---|---|---|---|---|
| Landing | Explain product and open demo | Cinematic responsive page | Public static content | None | Build; truthful labels reviewed | Working and verified locally |
| Authentication | Private local workspace | Register, sign in/out, errors | Salted scrypt, HttpOnly session, CSRF, expiry, membership recheck | Local SQLite | Returning login; wrong password; expiry; logout; revoked membership | Working local; hosted verification/recovery/MFA blocked |
| Career profile | Save stable career direction | Profile editor and save state | Strict schema, optimistic revision, stable profile/skill IDs | Local API | ID retention; stale edit; forged fields | Working and verified locally |
| Career Digital Twin | Separate facts from interpretations | Evidence ledger, locks, versions | Source quote validation, history, status labels | Local API | Locked edit denied; source mismatch denied | Partial: employment/education structures remain generic facts |
| CV studio | Import, review, version and export text | Original/proposed comparison | Tenant-owned document records; exact-version approval; authenticated export | Pasted text only | Approval invalidation; unauthorized download; long text restore | Working text scope; PDF/DOCX blocked |
| Vacancy import | Assess user-provided vacancy | Manual form and status/provenance | HTTPS reference validation; no retrieval | User content only | Private URL rejected; failed fixture retrieval rejected | Working manual scope; live discovery blocked |
| Matching | Explain evidence and gaps | Dimensions, rubric, uncertainty | Deterministic v2; inferred claims excluded; unknown preserved | No AI | Exact skill, missing requirement, injection fixtures | Working limited baseline; not hiring probability |
| Target Radar | Set companies, roles or intersection | Consented modes | Tenant scoped target record | Synthetic fixtures | Consent, stale, repost, duplicate tests | Demo-only |
| Opportunity Agent | Plan, discover, draft, approve, verify | Persistent lifecycle and audit | Input snapshot, exact hashes, 30-minute approval, idempotency | Fixture read tool; internal preparation only | Full run, pause/resume/cancel, tamper/expiry denial | Working synthetic scope |
| Applications | Track legitimate application state | Search, filters, notes, delete, confirmation form | Transition rules and submission evidence/history | Manual confirmation only | Illegal transition; duplicate; retry persistence | Working and verified locally |
| Interviews | Prepare truthful practice notes | Role questions and notes | Saved against tracked vacancy | Deterministic | Existing unit/browser coverage | Working and verified locally |
| Private operations | Recover local data | Operator CLI | Integrity/foreign-key checks; restored sessions revoked | SQLite | Populated backup/restore test | Working local scope |
| Privacy controls | Export and delete local account | Settings export + exact typed deletion | CSRF, owner check, portable non-secret JSON, complete tenant/user cascade | Local API/SQLite | Store and HTTP export/deletion tests | Working and verified locally |
| Hosted Core MVP model | Prepare production data boundary | Not connected to UI | Owner-only RLS, read-only direct grants, private object path policy | Prepared Supabase SQL | 3 static migration guardrail tests | Implemented unverified; no project |
| Networking, assessments, offers, growth | Later career stages | Journey labels only | None | None | No false completion claim | Approved later phase |
| Billing, agency, platform admin | Commercial operations | Disabled/unavailable | No privileged/customer endpoints | None | Protected routes return 404 | Blocked / later phase |
