# Vacancy source policy

Allowed source classes are user-submitted descriptions/URLs, employer/ATS endpoints whose terms permit use, licensed providers, and explicit fixtures. Each adapter must record source name and ID, canonical URL, permission basis, retrieval/publication timestamps, content hash, availability, evidence, and failure reason.

Forbidden behavior includes bypassing authentication, CAPTCHAs, robots/anti-bot controls, rate limits, or site restrictions; crawling private networks; following unsafe redirects; accepting page instructions as agent authority; fabricating a result after provider failure; and claiming LinkedIn, Indeed, or any other coverage without authorization.

Before enabling an adapter: document its permission basis, constrain hosts and paths, reject credentials and non-HTTPS/private/reserved destinations, cap response size/time/redirects/retries/pages, sanitize content, version snapshots, rate-limit per tenant/provider, test stale/changed/closed/reposted/duplicate cases, and add a kill switch. The current adapter is fixture-only and must remain labeled synthetic.
