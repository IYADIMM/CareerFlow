# Operational cost model

Planning estimate only; USD/month, October 2026 assumptions, not provider quotes or bills. Active user assumption: 8 AI-assisted workflows/month at about $0.19 blended model cost each, 20 MB retained documents, 10 transactional emails, bounded background work, and no uncontrolled crawling. Vacancy licensing is zero until an approved source is purchased.

| Category | 10 users | 100 users | 1,000 users | 10,000 users | Main assumption |
|---|---:|---:|---:|---:|---|
| Frontend/backend hosting | 20 | 25 | 50 | 200 | low fixed service, scale by traffic |
| Hosted database/auth | 25 | 25 | 100 | 600 | managed Postgres/Auth |
| Private storage/egress | 0.20 | 2 | 20 | 200 | 20 MB/user plus moderate downloads |
| AI usage | 15 | 150 | 1,500 | 15,000 | $1.50/active user with quotas |
| Transactional email | 0.10 | 1 | 10 | 100 | 10 messages/user |
| Background processing | 5 | 20 | 100 | 800 | bounded queues/workers |
| Observability | 0 | 20 | 100 | 500 | retention sampled by scale |
| Document processing | 1 | 10 | 100 | 1,000 | parsing/export, OCR excluded |
| Backups | 5 | 10 | 50 | 300 | database plus private objects |
| Vacancy source licensing | 0 | 0 | 500 | 2,500 | illustrative only; obtain quotes |
| **Estimated total before payment fees** | **71.30** | **263** | **2,530** | **21,200** | sum of rows |

Payment fees are excluded because price, currency, merchant entity, and processor are undecided; model them as provider percentage × collected revenue plus per-transaction and FX/tax costs. OCR, premium job data, high-volume email, support, legal, security review, taxes, refunds, and founder/employee labor are excluded.

Main cost risks are verbose/high-tier AI use, OCR, source licenses, document egress, long log retention, and retry loops. Controls: per-plan quotas, smaller validated models, caching source snapshots and deterministic scores, token/latency/cost records, response and retry caps, lifecycle storage rules, alerts, and provider kill switches. No profitability claim is made.
