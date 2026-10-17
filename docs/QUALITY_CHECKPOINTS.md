# Quality checkpoints

Evidence date: 17 October 2026. Commit is the release commit containing this file; environment is local loopback with synthetic data unless stated otherwise.

| ID | Result | Evidence | Remaining action |
|---|---|---|---|
| Q01 Requirements | PASS for declared local scope | Feature acceptance matrix and truthful landing | Implement later modules only in their roadmap phases |
| Q02 Data/business truth | PASS for fixtures | Versioned facts, source labels, unknown scores, deterministic rubric | Larger labeled evaluation set |
| Q03 Authentication | BLOCKED for production | Local registration/login/logout/expiry tests pass | Hosted verification, recovery, MFA and recent-auth controls |
| Q04 Authorization | PASS locally; BLOCKED hosted | Cross-tenant, collaborator, revoked membership, forged ID and download tests | Execute Supabase RLS suite/advisors |
| Q05 Owner control | PASS for absence of local admin paths; BLOCKED production | Platform owner/transfer/membership routes return 404 | Controlled owner identity, MFA, provider access review |
| Q06 Input/file safety | PASS for current text/URL scope | Strict schemas, limits, relationship checks, internal URL rejection | Secure PDF/DOCX parser and redirect/DNS controls before live fetch |
| Q07 Secrets/privacy | PASS locally; BLOCKED customer use | No provider secrets; no authenticated browser persistence; local notice | Encryption, retention/deletion, hosted storage and legal approval |
| Q08 Agent execution | PASS for synthetic scope | Snapshots, tool call evidence, hashes, approval expiry, receipts, audit | Authorized live adapter evaluation |
| Q09 Reliability | PASS locally | Revisions, idempotency, pause/resume/cancel, timeout messaging, restore test | Production queue/reconciliation tests |
| Q10 Integrations | NOT_APPLICABLE | No live AI, email, vacancy, billing or webhook adapter | Test each when introduced |
| Q11 Usability/accessibility | PASS for implemented local review | 390px/desktop prior evidence; focus target, skip link, labels, reduced motion | Formal automated/manual WCAG audit; RTL is outside current scope |
| Q12 Performance/cost | PASS for bounded local scope | 600 KB API body, 80k document text, 20 runs/day, $0 deterministic budget | Hosted load and cost tests |
| Q13 CI/regression | PASS | Typecheck, lint, build, 27 tests; read-only CI workflow | Enable branch protection in GitHub settings |
| Q14 Operations/recovery | PASS locally; BLOCKED production | SQLite backup/isolated restore/integrity/session-revocation test | Production backup schedule and restore drill |
| Q15 Reporting/billing | PASS for truthful local dashboards; billing NOT_APPLICABLE | Counts derive from records; billing disabled | Reconcile provider data if billing is implemented |
| Q16 Release/handover | BLOCKED for customer release | Setup, policy notice, runbook, risks and release report | Close all production blockers below |

`BLOCKED` is intentionally not treated as a pass. Passing tests demonstrate observed behavior, not impossibility of unauthorized action.
