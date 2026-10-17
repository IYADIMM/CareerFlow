# Residual-risk register

| Risk | Severity | Current control | Required closure |
|---|---|---|---|
| Local identity lacks email verification/recovery/MFA | High for customer use | Loopback only; synthetic-data notice | Hosted identity and sensitive-admin MFA |
| SQLite files are not application-encrypted | High for customer use | Local machine scope and repository ignore | Encrypted hosted database/private storage |
| Supabase migration/RLS unexecuted | High | Prepared migration and pgTAP suite | Isolated project, RLS tests and advisors |
| No live vacancy provider | Medium | Fixtures labeled; no network retrieval | Permitted source adapter, redirect/DNS/timeout limits and evaluation |
| Generic fact model lacks structured chronology | Medium | Categories, versions, sources and locks | Employment/education/achievement schemas and conflict UI |
| Text-only export | Medium | Authenticated exact-version plain text | Private PDF/DOCX generation, visual/text extraction tests |
| Account deletion/retention incomplete | High for customer use | Workspace clear accurately scoped | Approved policy, account deletion, backup expiry and export |
| Advanced five modules unavailable | Medium/product | Journey and landing truthfully label scope | Implement in roadmap order |
| Accessibility not formally audited | Medium | Keyboard/focus/mobile/reduced-motion controls | Automated and assistive-technology audit |
| Production observability/DR absent | High for customer use | Request IDs and local restore test | Redacted logs, alerts, production backup/restore drill |
