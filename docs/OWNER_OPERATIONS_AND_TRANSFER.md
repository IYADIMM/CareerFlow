# Owner operations and transfer runbook

## Local backup and restore

Stop writes, then run `node server/operations.ts backup .local/careerflow.sqlite <new-backup-path>`. Restore only into a new isolated path with `node server/operations.ts restore <backup-path> <new-database-path>`. The command verifies SQLite integrity and foreign keys; restores delete all sessions. Validate record counts and an approved document download before promoting the restored copy. Keep backup files outside the repository with restricted operating-system access.

## Owner provisioning

Before customer use, the owner must control repository, hosting, database, storage, domain, email, monitoring, billing and AI-provider accounts. Use unique named identities, MFA, least privilege and documented recovery. Store no secrets in the repository or browser bundle. Review access quarterly and after every personnel or ownership change.

## Transfer

No transfer endpoint exists. For a sale, define the assets in the signed agreement, require current-owner MFA and recent authentication, verify the recipient independently, issue an expiring single-use acceptance, recheck authority at acceptance, export audit evidence, rotate every credential, revoke former access and notify affected operators. Abort on expiry, replay, changed recipient or changed scope. Never create a hidden fallback account.
