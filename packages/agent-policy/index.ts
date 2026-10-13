import type { ActionKind, AgentRun, Principal } from '../agent-core/index.ts';
export function authorize(principal: Principal, run: AgentRun) {
  if (principal.tenantId !== run.tenantId || principal.userId !== run.userId || principal.role === 'viewer') throw new Error('Access denied.');
}
export function authorizeAction(action: ActionKind, principal: Principal, run: AgentRun) {
  authorize(principal, run);
  if (action !== 'record_preparation') throw new Error('External action adapter is disabled.');
  if (!run.approvalAt || run.drafts.length === 0 || run.drafts.some(draft => !run.approvedHashes.includes(draft.hash))) throw new Error('Explicit approval for these draft versions is required.');
  if (run.usage.costCents > run.budgetCents) throw new Error('Cost budget exceeded.');
}
