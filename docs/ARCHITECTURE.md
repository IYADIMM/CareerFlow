# Architecture

## 2026-10-13 additions

The UI now supports browser demo storage and an authenticated loopback SQLite API. Session restoration completes before displaying a workspace; authenticated records never fall back to browser storage. Profile edits preserve identity and existing skill evidence, while serialized writes and revision checks prevent silent overwrites.

Reusable agent packages separate core lifecycle/tool interfaces, policy, source adapters and evaluations. CareerFlow adapters have no dependency on CategoryFlow. The local action executor records approved preparation; it has no external submission, account, messaging or paid-model adapter. All run state, approvals, receipts, follow-ups and audit events persist in server storage.

Production still targets the PostgreSQL/Supabase architecture below. SQLite and local passwords are a development adapter, not the Netlify production database/auth implementation.

## Current shape

The project is a Vite multi-page build. `index.html`, `styles.css`, and `main.js` retain the cinematic public experience. `app.html` mounts a React/TypeScript application with hash routing so static hosting needs no rewrite. A typed local repository validates persisted state with Zod.

## Target boundaries

```text
Browser UI
  -> authenticated serverless API
      -> authorization + entitlement policy
      -> domain services
          -> PostgreSQL / private object storage
          -> AI provider adapter
          -> billing provider adapter
```

The browser may send a desired workspace identifier, but the server must derive effective membership and role from the authenticated user. Service-role database keys, AI keys and billing secrets are server-only.

## Domain modules

Career Profile, Skills, Documents, Vacancies/Matching, Networking, Applications, Interviews, Offers/Growth, Recommendations, Billing, Organizations and Audit are separate modules over shared identity, evidence and authorization primitives.

## AI contract

Each intelligence module owns a versioned prompt, Zod input/output schema, token budget, retry/timeout policy and evaluation fixtures. Provider adapters return structured output plus usage. Deterministic baselines are labeled and never described as AI. Provider output cannot directly mutate verified facts.

## Evolution

Replace the local repository behind the existing UI contract with authenticated APIs. The database migration is the target persistence model; no schema-generated types are committed until a real development project exists.
