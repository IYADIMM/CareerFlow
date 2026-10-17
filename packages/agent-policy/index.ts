import type { ActionKind, AgentRun, Principal } from '../agent-core/index.ts';
import { createHash } from 'node:crypto';
export function authorize(principal: Principal, run: AgentRun) {
  if (principal.tenantId !== run.tenantId || principal.userId !== run.userId || principal.role === 'viewer') throw new Error('Access denied.');
}
export function authorizeAction(action: ActionKind, principal: Principal, run: AgentRun) {
  authorize(principal, run);
  if (action !== 'record_preparation') throw new Error('External action adapter is disabled.');
  if (!run.approvalExpiresAt || Date.parse(run.approvalExpiresAt)<=Date.now()) throw new Error('Approval expired. Create a fresh run for review.');
  if (run.drafts.some(draft=>createHash('sha256').update(draft.text+draft.vacancyId).digest('hex')!==draft.hash)) throw new Error('Draft content changed after approval.');
  if (!run.approvalAt || run.drafts.length === 0 || run.drafts.some(draft => !run.approvedHashes.includes(draft.hash))) throw new Error('Explicit approval for these draft versions is required.');
  if (run.usage.costCents > run.budgetCents) throw new Error('Cost budget exceeded.');
}
