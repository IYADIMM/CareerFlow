# Database schema

## Working development persistence

The loopback API creates SQLite tables: users, organizations, memberships, sessions, workspaces, target_radar, agent_runs, agent_checkpoints, approvals, action_receipts, follow_ups, audit_events and idempotency. Tenant identity comes from authenticated membership, not body fields. Agent revision changes, checkpoint inserts, audit events and idempotency results commit atomically. Unique run/vacancy receipt and follow-up keys prevent duplicate side effects.

The Supabase foundation below is still unapplied. Its October 13 corrections restrict browser data to authenticated profile owners, close agency reads until explicit consent exists, protect ownership columns, enable catalog RLS and remove client membership mutations. The pgTAP test file is prepared but has not been run against PostgreSQL.

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
