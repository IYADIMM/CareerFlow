# Master requirements ledger

Evidence cut: 17 October 2026. Allowed status vocabulary from Directive 001 is used verbatim. `VERIFIED_PASSED` means the cited behavior ran in the named environment; source-only hosted work is never reported as verified.

| ID | Requirement | Priority | Status | Files | Test evidence | Blocker |
|---|---|---:|---|---|---|---|
| CF-000-01 | Execute the brief, preserve truth, and optimize for a usable safe product | P0 | VERIFIED_PASSED | repository, this ledger | Reconciliation audit | — |
| CF-001-01 | Read the complete brief, inspect repository/instructions, and track every independent requirement | P0 | VERIFIED_PASSED | this ledger | Five complete reads; repository audit | — |
| CF-001-02 | Use stable IDs, dependencies, objective acceptance criteria, evidence, and allowed statuses | P0 | VERIFIED_PASSED | this ledger | Manual reconciliation | — |
| CF-001-03 | Record exact blockers and continue unrelated work | P0 | VERIFIED_PASSED | all final docs | Blockers distinguish external/approval/technical | — |
| CF-002-01 | Treat current repository/stack/documents as source of truth and avoid duplication | P0 | VERIFIED_PASSED | existing source/docs | Git/source inventory | — |
| CF-003-01 | Inspect status, changes, branches, upstream, PRs, and CI; preserve work | P0 | VERIFIED_PASSED | Git/GitHub | Clean `main` at `088e93b`; Actions run 39038776390 passed | — |
| CF-003-02 | Work on isolated `codex/careerflow-production-completion` branch | P0 | VERIFIED_PASSED | Git | `git branch --show-current` | — |
| CF-004-01 | Preserve the 20-part product vision without misrepresenting roadmap features | P0 | VERIFIED_PASSED | `FEATURE_ACCEPTANCE_MATRIX.md` | Module-by-module disposition | — |
| CF-005-01 | Represent all ten career stages and connect implemented workflows | P1 | VERIFIED_PASSED | `src/app-main.tsx` | UI/unit suite; production build | — |
| CF-005-02 | Make stages 1–6 complete before advanced stages 7–10 | P1 | BLOCKED_EXTERNAL | core flows | Acceptance matrix | Hosted persistence, permitted live source, PDF/DOCX export, AI provider |
| CF-006-01 | Inspect prepared hosted schema, memberships, tenant/RLS/storage/application/agent/evidence/audit boundaries | P0 | VERIFIED_PASSED | `supabase/`, `FINAL_ARCHITECTURE.md` | Source audit | — |
| CF-006-02 | Use an authorized Supabase project or prepare exact production integration | P0 | IMPLEMENTED_UNVERIFIED | `supabase/migrations/*.sql`, `DEPLOYMENT_RUNBOOK.md` | Static migration tests | No authorized Supabase project exists |
| CF-006-03 | Hosted registration, confirmation, login/logout, reset, refresh/expiry, recovery, recent auth, MFA, membership validation | P0 | BLOCKED_EXTERNAL | `FINAL_OWNER_ACTIONS.md` | No hosted auth test claimed | Supabase project/domain/email configuration required |
| CF-006-04 | RLS, server tenant auth, least privilege, private storage, service-role isolation, tenant queries, safe migrations | P0 | IMPLEMENTED_UNVERIFIED | two migrations | Static migration guardrails; local tenant tests | Actual isolated-project RLS execution required |
| CF-006-05 | Secure export, deletion lifecycle, revocation, auditability | P0 | VERIFIED_PASSED | `server/store.ts`, `server/index.ts`, Settings | Local API/store regression tests | Hosted lifecycle remains unverified |
| CF-006-06 | Never trust client tenant IDs or expose service role to browser | P0 | VERIFIED_PASSED | server authorization; migration grants | Forged tenant/field tests; static service-role review | — |
| CF-006-07 | Document safe local-to-hosted migration using synthetic accounts | P0 | IMPLEMENTED_UNVERIFIED | `DEPLOYMENT_RUNBOOK.md` | Runbook review | Needs isolated hosted project |
| CF-006-08 | Execute two-user/two-tenant/wrong-tenant/forgery/revocation/escalation/private-file/session/recovery tests on hosted DB | P0 | BLOCKED_EXTERNAL | `supabase/tests/` | Prepared pgTAP only; not executed | Supabase project unavailable |
| CF-007-01 | Durable structured Career Digital Twin covering professional history and preferences | P1 | IN_PROGRESS | `src/types.ts`, Evidence Panel, core migration | Version/provenance tests | Several domain-specific fields remain JSON/generic locally |
| CF-007-02 | Evidence status must separate verified, supported, declared, suggested, confirmation, conflict, rejection | P1 | IN_PROGRESS | types/schema/docs | Inferred-skill exclusion and source quote tests | Status vocabulary mapping needs hosted implementation |
| CF-007-03 | Preserve source, timestamp, approved value, revisions, status, and generated-material usage | P1 | VERIFIED_PASSED | workspace rules/store | Fact history, lock, source, approval invalidation tests | — |
| CF-007-04 | User can confirm/correct/reject/lock/review/delete/export; model reused across workflows | P1 | IN_PROGRESS | Evidence Panel, Settings, store | Local fact/export/delete tests | Conflict UI and per-fact delete/retention policy incomplete |
| CF-008-01 | Accept PDF, DOCX, TXT, and pasted text | P1 | BLOCKED_TECHNICAL | CV Studio | Pasted-text tests only | Binary parser/upload pipeline not implemented |
| CF-008-02 | Validate size/MIME/extension/signature; private storage; safe parsing/temp files; provenance/history/errors/malware controls | P1 | IN_PROGRESS | schema, private bucket, workspace | Size/provenance/version tests; private policy static test | Parser and malware scanning require implementation/project |
| CF-008-03 | Extract CV fields with human review; disclose OCR limitations | P1 | IN_PROGRESS | intelligence/CV UI | Deterministic section detection | PDF/DOCX/OCR absent |
| CF-008-04 | Generate/export CV, cover letter, outreach, interview brief, match report in ATS-safe DOCX/PDF/TXT | P1 | IN_PROGRESS | tailoring/text export | Exact approved TXT export tests | DOCX/PDF/layout/extraction verification absent |
| CF-008-05 | Preserve original; separate/version tailored artifacts; show diff; prohibit fabrication | P1 | VERIFIED_PASSED | Document Review, workspace rules | Original immutability, derived fact rejection, version tests | — |
| CF-009-01 | Rich search configuration including titles, seniority, geography, compensation, exclusions, sources/frequency | P1 | IN_PROGRESS | Agent radar | Role/company/mode/salary covered | Remaining filters/frequency absent |
| CF-009-02 | Use legal authorized sources; never bypass restrictions or claim unsupported coverage | P1 | VERIFIED_PASSED | source policy, fixture adapter | Fixture permission tests; truthful UI | — |
| CF-009-03 | Preserve discovery provenance, dates, canonical URL, evidence, fit, and duplicate relationship | P1 | VERIFIED_PASSED | agent tools/core/store | Agent and correction tests | Live provenance remains unavailable |
| CF-009-04 | Detect expiry/closure/duplicate/repost/change/unavailable links | P1 | IN_PROGRESS | agent tools | Expired/repost/duplicate/retrieval-failure tests | Live link/change checks need source adapters |
| CF-009-05 | Defend against injection, redirects, SSRF, loops, duplicates, limits, source failure; bounded retries/no fabrication | P1 | VERIFIED_PASSED | safety/tools/core | Unsafe URL, injection fixture, rate/run limit tests | Live retry adapter absent |
| CF-009-06 | Expanded labeled evaluation set and measured source/matching/error metrics | P1 | IN_PROGRESS | `packages/agent-evals`, evaluation report | Four-record synthetic eval rerun | Representative licensed/live sample unavailable |
| CF-010-01 | Match on complete domain factors and distinguish suitability/confidence/evidence/reliability | P1 | IN_PROGRESS | intelligence/match UI | Deterministic match tests | Industry/P&L/education/cert/compensation/language incomplete |
| CF-010-02 | Explain fit, strengths, partials, unknowns, gaps, seniority, compensation, recommendations | P1 | IN_PROGRESS | Match UI | Match-report tests | Some dimensions not modeled |
| CF-010-03 | Do not reward inference/missing data/title/salary invention or inflate scores; deterministic rubric | P1 | VERIFIED_PASSED | intelligence | Regression tests for inference, unknown, substring | — |
| CF-011-01 | Approved master + full JD + requirement extraction + verified facts + achievements + truthful wording | P1 | IN_PROGRESS | store tailor/intelligence | Evidence-only tailoring tests | Tailoring is deterministic baseline, not full document engine |
| CF-011-02 | Preserve chronology, flag unsupported claims, version, compare, approve/reject, professional export | P1 | IN_PROGRESS | Document Review/CV Studio | Version/approval/export tests | Per-change reject and DOCX/PDF missing |
| CF-011-03 | Never fabricate employment, qualifications, metrics, seniority, tools, or exposure | P0 | VERIFIED_PASSED | policy/store/evals | Derived-fact rejection; zero fabricated qualifications fixture | — |
| CF-011-04 | Side-by-side diff with reasons/evidence/controls and locked facts | P1 | IN_PROGRESS | `DocumentReview.tsx` | Browser/source review | Highlight/reason granularity incomplete |
| CF-012-01 | Explicit agent lifecycle plus failure/pause/cancel/retry | P1 | VERIFIED_PASSED | agent core/store/UI | 9 agent tests | — |
| CF-012-02 | Separate discovery/retrieval/freshness/matching/evidence/drafting/approval/preparation/tracking/notification tools | P1 | IN_PROGRESS | agent packages | Tool invocation/evidence tests | Several tools still composed in server orchestration |
| CF-012-03 | Deny external applications/messages/purchases/ownership/publishing/sharing without adapters and scoped approval | P0 | VERIFIED_PASSED | agent policy/server | Policy/404 tests; no external adapters | — |
| CF-012-04 | Approval bound to identity/tenant/target/payload/snapshot/version/hash/expiry and invalidated on change | P0 | VERIFIED_PASSED | agent policy/store | Tamper, expiry, changed-input tests | — |
| CF-012-05 | No uncertain auto-retry or false employer receipt; auditable run evidence | P0 | VERIFIED_PASSED | store/UI/docs | Idempotency, receipt, history tests | — |
| CF-013-01 | Coherent application statuses and required application data | P1 | IN_PROGRESS | types/Applications Page | Transition/history tests | Recruiter, cover-letter, interview, salary fields incomplete |
| CF-013-02 | Explicit submission evidence; separate draft/approval/navigation/local receipt/external acknowledgment | P0 | VERIFIED_PASSED | workspace rules/app UI | Illegal transition and confirmation tests | — |
| CF-013-03 | Search/filter/sort/dedup/notes/history/attachments/follow-ups/dashboard | P1 | IN_PROGRESS | Applications Page/dashboard | Browser/unit coverage | Attachments and advanced sorting incomplete |
| CF-014-01 | Job/employer/seniority/responsibility/skill/leadership challenge analysis from authorized sources | P3 | IN_PROGRESS | Interview Prep | Deterministic job-specific plan | Authorized employer context unavailable |
| CF-014-02 | Broad question bank with evidence-backed STAR/CAR/executive answer support | P3 | IN_PROGRESS | intelligence/Interview Prep | Saved question/notes tests | Full bank/coaching incomplete |
| CF-014-03 | Do not encourage invented stories | P0 | VERIFIED_PASSED | interview copy/policy | Source review | — |
| CF-015-01 | Text interview simulator with roles/JD/difficulty/persona/timing/follow-ups/feedback/history/progress | P3 | NOT_STARTED | roadmap | No evidence | Dependency order: core MVP first |
| CF-015-02 | Optional authorized audio/transcription/coaching without trait inference or outcome promises | P3 | NOT_STARTED | roadmap | No evidence | Owner/provider approval and core MVP first |
| CF-016-01 | Recruiter/employer relationship records, history, links, notes, reminders, drafts, relationships | P3 | NOT_STARTED | roadmap | No evidence | Core MVP first |
| CF-016-02 | No restricted contact harvesting or unauthorized outreach | P0 | VERIFIED_PASSED | agent policy/source policy | No outreach adapter; policy tests | — |
| CF-017-01 | Offer comparison across cash, benefits, location, terms, tax assumptions, scope and alignment | P3 | NOT_STARTED | roadmap | No evidence | Core MVP first |
| CF-017-02 | Mark unknowns/assumptions and calculation basis; distinguish cash/benefits/speculation | P3 | NOT_STARTED | roadmap | No evidence | Core MVP first |
| CF-018-01 | Evidence-linked skill gaps/readiness/development/courses/schedules/practice/achievement/reassessment | P3 | NOT_STARTED | roadmap | No evidence | Core MVP first |
| CF-018-02 | Never imply course completion is a credential | P0 | VERIFIED_PASSED | product policy | No feature makes claim | — |
| CF-019-01 | Inspect UI/UX Pro Max and 21st availability; use available design workflow without installing unknown code | P1 | VERIFIED_PASSED | UIUX review | Skill read/search; no 21st tool exposed | — |
| CF-019-02 | Premium coherent application screens/navigation/states without deceptive controls | P1 | IN_PROGRESS | React/CSS | Browser tests/build; prior screenshots | Full screen matrix not complete |
| CF-019-03 | WCAG 2.2 AA: keyboard/focus/screen reader/contrast/headings/forms/reduced motion/zoom/tables | P1 | IN_PROGRESS | app/workflow CSS | Focus/semantic/error/reduced-motion source + browser tests | Formal audit/contrast scan pending |
| CF-019-04 | Responsive checks at 320/375/390/430/768/1024/1280/1440/1920 with browser inspection | P1 | IMPLEMENTED_UNVERIFIED | responsive CSS/screenshots | Existing 390/desktop artifacts | Complete current-branch viewport sweep pending |
| CF-020-01 | Provider-independent server AI adapters with validation/output/retry/timeout/error/rate/quota/usage/cost/trace/prompt/eval/fallback | P1 | BLOCKED_EXTERNAL | architecture report | No provider test claimed | Provider and data-processing approval/credentials absent |
| CF-020-02 | Treat all content as untrusted; injection cannot alter permissions or leak secrets; minimize/disclose data | P0 | VERIFIED_PASSED | agent policy/evals/security docs | Injection/authorization tests | Hosted/provider integration remains pending |
| CF-021-01 | Entitlement architecture for plans/features/quotas/limits/subscription/trials/cancel/change/history | P2 | NOT_STARTED | roadmap | No evidence | Core hosted MVP first |
| CF-021-02 | Evaluate provider/jurisdiction; test only; no live billing without approval | P2 | REQUIRES_OWNER_APPROVAL | owner actions | Billing intentionally untouched | Owner entity/jurisdiction/provider approval |
| CF-021-03 | No invented prices/success/client-authoritative entitlements | P0 | VERIFIED_PASSED | site/app | Source/content review | — |
| CF-022-01 | Protect all candidate/account records with auth/RLS/private storage/revocation/export/delete/retention/audit/least privilege/rotation/rate/input/error/redaction/backup | P0 | IN_PROGRESS | security docs/server/migrations | Local security tests + static migration tests | Hosted execution, retention approval, secret rotation pending |
| CF-022-02 | Prepare privacy/terms/consent/AI/provider/subscription/retention/deletion materials without false legal claims | P2 | IN_PROGRESS | `policy.html`, security docs | Content review | Qualified legal review required |
| CF-023-01 | Explicit expiring approval for external actions and deletion; show exact target/content; idempotency/reconciliation | P0 | VERIFIED_PASSED | policy/store/Settings | Agent and deletion tests | External adapters intentionally absent |
| CF-023-02 | Preserve suggested/drafted/approved/prepared/executed/externally verified distinctions | P0 | VERIFIED_PASSED | types/UI/docs | Workflow tests and labels | — |
| CF-024-01 | Hosting/backend/Postgres/storage/auth/HTTPS/isolation/secrets/health/logging/monitoring/backups/restore/migrations/rollback/CI | P0 | IN_PROGRESS | CI/runbooks/migrations | CI and local health/restore evidence | Hosted staging unavailable |
| CF-024-02 | Local/staging/production isolation and no production-data destructive tests | P0 | VERIFIED_PASSED | runbook/config | Environment design review | — |
| CF-024-03 | No public launch/main merge/live billing/real customer data without owner approval; provide only real URL | P0 | REQUIRES_OWNER_APPROVAL | owner actions | No deployment performed | Owner approval and infrastructure |
| CF-025-01 | Low-cost bounded architecture with quotas/caching/accounting and no uncontrolled loops | P1 | VERIFIED_PASSED | agent/store/architecture | Run limits/budgets/idempotency tests | — |
| CF-025-02 | Cost estimates for 10/100/1k/10k users across all categories; fixed vs variable; no profit promise | P2 | VERIFIED_PASSED | `OPERATIONAL_COST_MODEL.md` | Arithmetic/assumption review | Pricing quotes require provider confirmation |
| CF-026-01 | Run current typecheck/lint/unit/integration/browser/security/build/eval/audit without deleting tests | P0 | VERIFIED_PASSED | package/CI/test evidence | Full local gate recorded | — |
| CF-026-02 | Hosted auth/database/document/source/AI/E2E coverage | P0 | BLOCKED_EXTERNAL | final test evidence | Explicitly not executed | Hosted services/adapters absent |
| CF-027-01 | Repeatable labeled AI evaluation across extraction/relevance/seniority/dedup/hallucination/injection/approval/citation/document/cost/latency | P1 | IN_PROGRESS | agent eval/report | Synthetic v1 results | Expand dataset and provider/live cohorts |
| CF-027-02 | Separate synthetic, controlled integration, and live observation; never overclaim | P0 | VERIFIED_PASSED | evaluation report | Truthful cohort labels | — |
| CF-028-01 | DB/document backup, retention, restore drill, health/alerts/latency/agent/AI/auth/background monitoring | P2 | IN_PROGRESS | operations/runbooks | SQLite restore test and health endpoint | Hosted storage/monitoring/alerts absent |
| CF-028-02 | Proposed RTO/RPO until measured and no sensitive CV logs | P0 | VERIFIED_PASSED | backup/security runbooks | Log/source review | Hosted drill needed |
| CF-029-01 | Complete acquisition site sections without fake endorsements/statistics | P2 | IN_PROGRESS | landing/policy | Production build/content review | Plans/FAQ/support depth incomplete |
| CF-029-02 | Explain value/difference/AI limits/start and measurable activation journey | P2 | IN_PROGRESS | landing/app | Honest demo labels and connected local flow | Real activation analytics unavailable |
| CF-030-01 | Nontechnical customer can complete first visit through export/tracking with clear recovery/no loss/fake states | P1 | IN_PROGRESS | app/UI | Browser test and save-error recovery | PDF/live/hosted full journey unavailable |
| CF-031-01 | Execute P0→P1→P2→P3 dependency order | P0 | VERIFIED_PASSED | ledger/report | Work and blockers ordered | — |
| CF-032-01 | Prohibit fake production/live/AI/security/submission/payment/deploy/backup/functionality/completion claims | P0 | VERIFIED_PASSED | all docs/UI | Terminology audit | — |
| CF-033-01 | Use exact release classifications and advance only with evidence | P0 | VERIFIED_PASSED | final release status | Classification audit | — |
| CF-034-01 | Create/update all 16 mandatory documents with actual status | P0 | VERIFIED_PASSED | `docs/` | File inventory/content review | — |
| CF-035-01 | Apply inspect→design→implement→test→review→fix→retest→record loop | P0 | VERIFIED_PASSED | development log/report | Baseline and post-change gates | — |
| CF-036-01 | Strict TS/lint/tests/auth/reproducible build/low cost/high-quality documentation | P0 | VERIFIED_PASSED | source/tests/docs | Final local gate | Hosted/UX claims remain scoped |
| CF-036-02 | Measure rather than invent Lighthouse/Core Web Vitals | P2 | BLOCKED_TECHNICAL | UIUX review | No score claimed | No current Lighthouse run |
| CF-037-01 | Re-read original, reconcile every requirement, and generate final reconciliation | P0 | VERIFIED_PASSED | `FINAL_REQUIREMENT_RECONCILIATION.md` | Count derived from this table | — |
| CF-038-01 | Final response follows mandated 11-section structure | P0 | IN_PROGRESS | final response | Verified at handoff | — |
| CF-039-01 | Commit/push dedicated branch, prepare PR with evidence/limits/SHA; do not merge | P0 | IN_PROGRESS | Git/GitHub | Pending final green gate | — |
| CF-039-02 | No paid service, live billing, external application, public deployment, or main merge without approval | P0 | VERIFIED_PASSED | delivery process | No prohibited action performed | — |
| CF-040-01 | Finish honestly: no skipped requirement or unverified claim | P0 | IN_PROGRESS | reconciliation/final response | Final audit pending | — |

## Dependency and acceptance notes

- Hosted acceptance requires an owner-authorized Supabase project, synthetic tenant accounts, migration execution, pgTAP/RLS results, Security Advisor results, and private-object access tests.
- Core MVP acceptance requires a permitted live vacancy source, binary document pipeline with ATS-checked PDF/DOCX output, and an approved provider adapter or a deliberate deterministic-only product decision.
- Commercial acceptance requires owner/legal/provider decisions; these are not substitutions for engineering and are not represented as complete.
