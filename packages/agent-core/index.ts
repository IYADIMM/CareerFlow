export const runStates = ['created','planning','ready','executing','verifying','awaiting_approval','paused','failed','cancelled','expired','completed'] as const;
export type RunState = typeof runStates[number];
export type ActionKind = 'record_preparation' | 'send_message' | 'submit_application' | 'purchase' | 'change_account';
export interface Principal { userId: string; tenantId: string; role: 'owner' | 'member' | 'viewer' }
export interface ToolContext { principal: Principal; runId: string; budgetCents: number; idempotencyKey: string }
export interface AgentTool<Input, Output> {
  name: string;
  action: 'read' | ActionKind;
  maxAttempts: number;
  execute(input: Input, context: ToolContext): Promise<Output>;
}
export interface Usage { provider: 'deterministic' | 'disabled'; inputTokens: number; outputTokens: number; costCents: number }
export interface Checkpoint { state: RunState; step: string; at: string; usage: Usage }
export interface Draft { vacancyId: string; text: string; evidence: string[]; gaps: string[]; score: number; seniorityWarning: string | null; compensation: { score: number | null; explanation: string }; hash: string }
export interface AgentRun {
  id: string; tenantId: string; userId: string; goal: string; state: RunState;
  pausedFrom?: RunState; plan: string[]; checkpoints: Checkpoint[];
  drafts: Draft[]; rejectedSources: Array<{ id: string; reason: string }>;
  duplicates: number; revision: number; expiresAt: string; budgetCents: number;
  usage: Usage; approvedHashes: string[]; approvalAt?: string;
  receipts: Array<{ id: string; vacancyId: string; kind: 'preparation_record'; verified: boolean }>;
  followUps: Array<{ vacancyId: string; dueAt: string; action: string }>;
  error?: string;
}
export const zeroUsage = (): Usage => ({ provider: 'deterministic', inputTokens: 0, outputTokens: 0, costCents: 0 });
export const terminal = (state: RunState) => ['completed', 'cancelled', 'expired'].includes(state);

export async function invokeTool<I,O>(tool: AgentTool<I,O>, input: I, context: ToolContext): Promise<O> {
  if (tool.action !== 'read') throw new Error('Side-effect tools are disabled; use an approval-bound action executor.');
  const attempts = Math.min(3, Math.max(1, tool.maxAttempts));
  if (context.budgetCents < 0) throw new Error('Cost budget exhausted.');
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try { return await tool.execute(input, context); }
    catch (error) {
      // Only explicitly transient read failures may be retried. Side effects never auto-retry.
      if (tool.action !== 'read' || !(error instanceof TransientToolError) || attempt === attempts) throw error;
    }
  }
  throw new Error('Tool attempts exhausted.');
}
export class TransientToolError extends Error {}
