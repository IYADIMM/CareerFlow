# Backup and restore runbook

## Verified local procedure

Stop writes, then run `node server/operations.ts backup SOURCE NEW_BACKUP`. The command uses an exclusive new destination and performs SQLite integrity and foreign-key checks. Restore with `node server/operations.ts restore BACKUP NEW_DESTINATION`; it also verifies integrity and deletes all restored sessions. Point a disposable local API at the restored database, sign in again, and compare record counts plus a representative approved document. The automated populated-database restore test passes.

## Hosted target

Use provider-managed point-in-time/database backups plus separately versioned private-object backup in the same approved region/account boundary. Encrypt backups, restrict restore permission, log restore operations, define retention by data class, and test quarterly into an isolated project with synthetic or appropriately minimized data. Reconcile database document versions with object keys and hashes.

Proposed targets—not measured commitments—are RPO ≤24 hours and RTO ≤8 hours for controlled beta, tightened only after drills. Document the start/end time, snapshot, migration version, row/object counts, hash sampling, auth isolation, data-loss window, and remediation. Delete temporary restores after evidence is approved. Never log or attach raw CV content to incident tickets.
