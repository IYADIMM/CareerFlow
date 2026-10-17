# Security and owner control

CareerFlow currently exposes candidate functions only through a personal local workspace. The server derives the tenant and user from the session, rechecks current membership and organization ownership, rejects viewers and collaborators, uses CSRF for mutations, bounds JSON input and uses optimistic revisions. Authenticated candidate records are not persisted to browser storage.

Platform ownership is intentionally not implemented as an email, name, browser role or hidden account. Iyad Mustafa is the declared original business owner, but production authority must be provisioned through a controlled provider identity with MFA and recent authentication. Tenant owners are not platform owners. No API exists to mutate global roles, secrets, billing credentials, source code or ownership.

Platform transfer is disabled. A future transfer needs verified current-owner initiation, verified recipient, exact asset scope, expiring single-use acceptance, authority recheck, audit/notification, credential rotation and access revocation. No developer or former owner may retain hidden access.

Private document downloads require a current tenant session and an approved exact version. Local SQLite is not application-encrypted. Full account deletion, backup expiry, collaborator consent/revocation, production storage and administrative break-glass access remain production blockers. The public policy page describes current behavior and is not represented as approved legal text.
