# Deployment

The Opportunity Agent milestone runs only on localhost. The native Node/SQLite API cannot be deployed as a persistent database on Netlify Functions. Before a hosted private demo, replace it with an approved hosted identity and PostgreSQL persistence adapter, run live authorization tests, configure TLS sessions and data lifecycle controls, then obtain deployment approval. The static UI configuration alone does not deploy the agent backend.

No deployment was performed. The repository includes a Netlify build configuration for a future private preview.

Before previewing externally: create a private repository, review generated artifacts, configure an isolated development environment, confirm no personal data exists in browser fixtures, run `npm run check`, and obtain founder approval. Before production: connect a custom domain only after authentication, privacy, authorization, monitoring, backup and deletion workflows pass review.

The current milestone introduces no paid requirement. Netlify and Supabase free allowances may be suitable for development, but their current quotas and commercial terms must be checked at provisioning time.
