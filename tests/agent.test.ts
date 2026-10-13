// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Store } from '../server/store';
import { emptyWorkspace, makeProfile } from '../src/lib/workspace';
import { authorizeAction } from '../packages/agent-policy';
import { evaluateAgent } from '../packages/agent-evals/run';
import { invokeTool, TransientToolError } from '../packages/agent-core';
import type { AgentRun, Principal } from '../packages/agent-core';
let store: Store;
afterEach(()=>{ store?.close(); });
const setup = () => {
  store = new Store(':memory:');
  const account = store.register({ email:'first@example.test',password:'test-password-12345' });
  const profile = makeProfile({ displayName:'Demo Candidate',email:'first@example.test',currentRole:'Commercial Director',yearsExperience:11,targetRole:'Commercial Director',location:'Dubai',workMode:'hybrid',objective:'Lead a regional commercial team.',skills:['commercial strategy','negotiation'] });
  store.saveWorkspace(account.principal,{ state:{ ...structuredClone(emptyWorkspace),profile },revision:0 });
  store.saveTargets(account.principal,{ roles:['Commercial Director','Commercial Assistant'],companies:[{ id:'meridian',name:'Demo Meridian',source:'fixture',enabled:true },{ id:'horizon',name:'Demo Horizon',source:'fixture',enabled:true }],consent:true });
  return account;
};
async function advance(principal: Principal, run: AgentRun) { return store.command(principal,run.id,{ action:'advance',revision:run.revision },randomUUID()); }
describe('Opportunity Agent',()=>{
  it('persists the entire approved workflow, receipts, follow-ups and audit',async()=>{
    const { principal } = setup(); let run = store.createRun(principal,{ goal:'Prepare opportunities for review' },randomUUID());
    for (let i=0;i<3;i++) run = await advance(principal,run);
    expect(run.state).toBe('awaiting_approval'); expect(run.drafts).toHaveLength(2); expect(run.duplicates).toBe(1); expect(run.rejectedSources).toHaveLength(1);
    expect(run.drafts.find(draft=>draft.vacancyId==='demo-assistant')?.seniorityWarning).toBeTruthy();
    expect(run.drafts[0].compensation.score).toBeNull();
    await expect(advance(principal,run)).rejects.toThrow('different action');
    await expect(store.command(principal,run.id,{ action:'approve',revision:run.revision,draftHashes:['wrong-hash'] },randomUUID())).rejects.toThrow('exact current draft');
    run = await store.command(principal,run.id,{ action:'approve',revision:run.revision,draftHashes:run.drafts.map(draft=>draft.hash) },randomUUID());
    run = await advance(principal,run); expect(run.state).toBe('verifying'); expect(run.receipts.every(receipt=>!receipt.verified)).toBe(true);
    run = await advance(principal,run);
    expect(run.state).toBe('completed'); expect(run.receipts.every(receipt=>receipt.verified)).toBe(true); expect(run.followUps).toHaveLength(2);
    expect(store.run(principal,run.id)).toEqual(run); expect(store.auditLog(principal).length).toBeGreaterThan(6);
    for (const action of ['send_message','submit_application','purchase','change_account'] as const) expect(()=>authorizeAction(action,principal,run)).toThrow('disabled');
  });
  it('rejects cross-tenant reads, writes and stale revisions',async()=>{
    const first=setup(); const second=store.register({ email:'second@example.test',password:'test-password-23456' });
    const run=store.createRun(first.principal,{ goal:'Prepare opportunities for review' },randomUUID());
    expect(()=>store.run(second.principal,run.id)).toThrow('not found');
    await expect(store.command(second.principal,run.id,{ action:'advance',revision:0 },randomUUID())).rejects.toThrow('not found');
    expect(store.runs(second.principal)).toEqual([]); expect(store.workspace(second.principal).state.profile).toBeNull();
    expect(()=>store.saveWorkspace(first.principal,{ state:emptyWorkspace,revision:0 })).toThrow('Workspace changed');
  });
  it('deduplicates repeated commands and rejects idempotency-key reuse',async()=>{
    const { principal }=setup(); const key=randomUUID(); const input={ goal:'Prepare opportunities for review' };
    const run=store.createRun(principal,input,key); expect(store.createRun(principal,input,key).id).toBe(run.id); expect(store.runs(principal)).toHaveLength(1);
    const command={ action:'advance',revision:0 }; const ck=randomUUID(); const next=await store.command(principal,run.id,command,ck);
    expect((await store.command(principal,run.id,command,ck)).revision).toBe(next.revision);
    await expect(store.command(principal,run.id,{ action:'cancel',revision:1 },ck)).rejects.toThrow('Idempotency');
  });
  it('persists across reopening the database and invalidates sessions on logout',()=>{
    store = new Store(':memory:'); store.close();
    const directory=mkdtempSync(join(tmpdir(),'careerflow-test-')); const path=join(directory,'test.sqlite');
    store=new Store(path); const account=store.register({ email:'persist@example.test',password:'test-password-34567' }); store.close();
    store=new Store(path); expect(store.session(account.token).email).toBe('persist@example.test'); store.logout(account.token); expect(()=>store.session(account.token)).toThrow('Sign in');
    store.close(); store=new Store(':memory:'); rmSync(directory,{ recursive:true,force:true });
  });
  it('supports pause, resume, cancel and expiry',async()=>{
    const { principal }=setup(); let run=store.createRun(principal,{ goal:'Prepare opportunities for review' },randomUUID());
    run=await store.command(principal,run.id,{ action:'pause',revision:0 },randomUUID()); expect(run.state).toBe('paused');
    run=await store.command(principal,run.id,{ action:'resume',revision:1 },randomUUID()); expect(run.state).toBe('created');
    run=await store.command(principal,run.id,{ action:'cancel',revision:2 },randomUUID()); expect(run.state).toBe('cancelled');
    await expect(advance(principal,run)).rejects.toThrow('terminal');
    let expiring=store.createRun(principal,{ goal:'Prepare a second opportunity run' },randomUUID()); expiring.expiresAt='2000-01-01T00:00:00Z';
    store.db.prepare('UPDATE agent_runs SET payload=? WHERE id=?').run(JSON.stringify(expiring),expiring.id);
    expiring=await advance(principal,expiring); expect(expiring.state).toBe('expired');
  });
  it('requires consent and denies viewer mutation',()=>{
    store=new Store(':memory:'); const { principal }=store.register({ email:'no-consent@example.test',password:'test-password-45678' });
    expect(()=>store.createRun(principal,{ goal:'Prepare opportunities for review' },randomUUID())).toThrow('consented targets');
    expect(()=>store.createRun({ ...principal,role:'viewer' },{ goal:'Prepare opportunities for review' },randomUUID())).toThrow('Access denied');
  });
  it('measures extraction and injection fixtures without claiming live accuracy',()=>{
    const result=evaluateAgent(); expect(result.extractionExactMatchPercent).toBe(100); expect(result.fabricatedQualificationsInInjectionFixture).toBe(0); expect(result.liveVerifiedUrlRate).toBeNull(); expect(result.timeSavingPercent).toBeNull();
  });
  it('bounds retries to transient read tools',async()=>{
    let attempts=0; const ctx={ principal:{ userId:'a',tenantId:'a',role:'owner' as const },runId:'r',budgetCents:0,idempotencyKey:'key' };
    await expect(invokeTool({ name:'read',action:'read',maxAttempts:99,async execute(){ attempts++; throw new TransientToolError('temporary'); } },{},ctx)).rejects.toThrow('temporary'); expect(attempts).toBe(3);
    attempts=0; await expect(invokeTool({ name:'write',action:'send_message',maxAttempts:3,async execute(){ attempts++; throw new TransientToolError('temporary'); } },{},ctx)).rejects.toThrow('disabled'); expect(attempts).toBe(0);
  });
});
