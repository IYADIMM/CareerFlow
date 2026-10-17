# Final owner actions

Only actions requiring founder authority are listed.

| Action | Reason | Expected result | Verification |
|---|---|---|---|
| Create or authorize an isolated Supabase staging project and connect it to this work | Codex found no authorized project; hosted Auth/Postgres/Storage/RLS cannot be executed otherwise | Staging project reference and approved access | Project appears in the connected Supabase account; no production data |
| Choose staging domain and transactional email sender/domain | Email confirmation/reset and secure redirect allowlists require owned identity | Verified sender/domain and staging redirect URLs | Confirm/reset succeeds for synthetic accounts only |
| Approve a permitted vacancy source/vendor after terms and cost review | Fixture data cannot prove a live customer journey | Written source permission and test credentials/endpoint | Controlled sample passes provenance/freshness/error tests |
| Approve one AI provider and its data-processing/retention settings, or choose deterministic-only MVP | External career data processing needs an explicit product/privacy decision | Server-only staging credential and documented purpose/retention | Redacted controlled integration/evaluation passes |
| Confirm operating entity/jurisdiction and obtain qualified legal review | Privacy, terms, retention, deletion, subscription, and provider disclosures cannot be self-certified | Approved launch policies and retention schedule | Counsel/owner approval recorded with version/date |
| Approve staging deployment after source review; separately approve any production/main merge | The master brief forbids public launch/main merge without approval | Authorized isolated staging only, then a later production gate | URL/commit smoke tested; no implicit production promotion |
| Decide billing provider/merchant eligibility and explicitly authorize test mode when ready | Billing depends on entity/jurisdiction and must not be activated live accidentally | Test-only account and approved entitlement model | Signed webhook tests; live mode remains disabled |

No owner action is needed to rerun local tests, review the branch, or inspect documentation.
