# Release status — 17 October 2026

Classification: **LOCAL_SYNTHETIC_DEMO**.

This classification covers the loopback React/Vite application, local Node/SQLite API, text CV workflow, manual vacancy matching, fixture Opportunity Agent, application tracker, interview notes, authenticated text export and local backup/restore. It does not cover customer or public deployment.

The correction release closes the reproduced local defects: unauthorized fields are rejected, memberships are rechecked, facts and documents are versioned, approval expires and invalidates after material change, inferred skills do not improve matching, unknown requirements remain unknown, application submission needs explicit evidence, forms await saves, landing/legal copy identifies unavailable functions, and signed-in local users can export or permanently delete their account.

The Core MVP Supabase schema, owner-only RLS design, private bucket and static guardrail tests are prepared but unexecuted. They are not proof of hosted security.

Production release remains blocked by hosted authentication with verification/recovery/MFA, a tested encrypted private backend and storage, executed RLS tests/advisors, approved privacy/retention/deletion terms, permitted live sources, production observability and recovery, and customer-scope accessibility/security review. PDF/DOCX, billing, agency collaboration and five advanced journey modules are unavailable.

The repository is `IYADIMM/CareerFlow`. See `FEATURE_ACCEPTANCE_MATRIX.md`, `QUALITY_CHECKPOINTS.md`, `TEST_EVIDENCE.md` and `RESIDUAL_RISKS.md` for evidence and exact next actions.
