# Database schema

The first migration establishes profiles, organizations, memberships, career profiles, evidence-aware skills, action recommendations and audit events. Every tenant record includes `organization_id`; personal workspaces are organizations of type `personal`.

Authorization must be enforced twice: RLS for database access and explicit server-side policy checks for sensitive commands. `organization_id`, membership role and entitlement claims supplied by the browser are never trusted.

Future migrations add the entities grouped below:

- Documents: documents, versions, parsed records and private storage metadata.
- Opportunity: sources, vacancies, saved jobs, matching reports and evidence.
- Execution: applications, application events/documents, recruiters, interactions and tasks.
- Readiness: interview sessions/questions/answers/feedback and assessments.
- Outcomes: offers/components, negotiation records, onboarding plans and milestones.
- Commercial: plans, subscriptions, entitlements, usage and provider event idempotency.

See `supabase/migrations/202610100001_foundation.sql` for executable SQL and initial RLS policies.

