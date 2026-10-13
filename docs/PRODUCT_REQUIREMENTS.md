# Product requirements

## Product outcome

CareerFlow AI is a connected career operating system for individuals, executives, coaches and agencies. Its shared Career Digital Twin must let information move between strategy, skills, CV, job discovery, networking, applications, interviews, offers and ongoing growth without being re-entered.

## MVP users and jobs

1. A professional records a truthful career foundation and target direction.
2. They import a CV and verify extracted facts before reuse.
3. They import a vacancy and receive an evidence-linked compatibility report with a distinct seniority check.
4. They prepare an evidence-safe tailored CV, track the application and create interview preparation.
5. A founder can provision a manually paid pilot through auditable entitlements without pretending payment is automated.

## Non-functional requirements

- Tenant isolation is enforced at the database and server boundary.
- AI inference is distinct from verified or user-declared facts.
- Uploaded content is untrusted and cannot alter system policy.
- All automated decisions expose supporting evidence, confidence and limitations.
- No live submission, message, purchase or profile change occurs without user review.
- The application remains usable without paid AI credentials through deterministic, clearly labeled fallbacks.
- WCAG 2.2 AA is the practical target; reduced motion and keyboard use are first-class.

## Milestone 1 acceptance

- The original landing animation and public demo remain functional.
- A React/TypeScript application builds successfully.
- A user can create, revisit, edit and delete a local career foundation.
- The command center reflects persisted profile progress and actionable recommendations.
- The ten-stage journey is navigable and available in a linear accessible layout.
- A Supabase-compatible tenant schema and RLS policies are reviewable but not applied automatically.
