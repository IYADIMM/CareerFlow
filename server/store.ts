import { DatabaseSync } from 'node:sqlite';
import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { emptyWorkspace, workspaceSchema } from '../src/lib/workspace.ts';
import { authorize, authorizeAction } from '../packages/agent-policy/index.ts';
import { invokeTool, terminal, zeroUsage } from '../packages/agent-core/index.ts';
import type { AgentRun, Principal } from '../packages/agent-core/index.ts';
import { deduplicate, digest, discoverTool, prepareDraft, verifySource } from '../packages/agent-tools/careerflow.ts';
import type { TargetCompany } from '../packages/agent-tools/careerflow.ts';

export class ApiError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
export const targetSchema = z.object({ roles: z.array(z.string().trim().min(2).max(120)).min(1).max(10), companies: z.array(z.object({ id: z.enum(['meridian','horizon']), name: z.enum(['Demo Meridian','Demo Horizon']), source: z.literal('fixture'), enabled: z.boolean() })).min(1).max(2), salary: z.object({ annual: z.number().positive().max(1e8), currency: z.enum(['AED','USD','EUR','GBP']) }).optional(), consent: z.literal(true) });
export type Targets = z.infer<typeof targetSchema>;
interface Session { principal: Principal; csrf: string; email: string }

export class Store {
  db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,salt TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS organizations(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id));
      CREATE TABLE IF NOT EXISTS memberships(tenant_id TEXT REFERENCES organizations(id),user_id TEXT REFERENCES users(id),role TEXT NOT NULL CHECK(role IN ('owner','member','viewer')),PRIMARY KEY(tenant_id,user_id));
      CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),tenant_id TEXT REFERENCES organizations(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS workspaces(tenant_id TEXT PRIMARY KEY REFERENCES organizations(id),payload TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS target_radar(tenant_id TEXT PRIMARY KEY REFERENCES organizations(id),payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS agent_runs(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES organizations(id),user_id TEXT NOT NULL REFERENCES users(id),payload TEXT NOT NULL,revision INTEGER NOT NULL,created_at TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS runs_tenant ON agent_runs(tenant_id,created_at);
      CREATE TABLE IF NOT EXISTS agent_checkpoints(run_id TEXT REFERENCES agent_runs(id),revision INTEGER,state TEXT NOT NULL,at TEXT NOT NULL,PRIMARY KEY(run_id,revision));
      CREATE TABLE IF NOT EXISTS approvals(run_id TEXT REFERENCES agent_runs(id),revision INTEGER,actor_id TEXT REFERENCES users(id),draft_hashes TEXT NOT NULL,at TEXT NOT NULL,PRIMARY KEY(run_id,revision));
      CREATE TABLE IF NOT EXISTS action_receipts(id TEXT PRIMARY KEY,tenant_id TEXT REFERENCES organizations(id),run_id TEXT REFERENCES agent_runs(id),vacancy_id TEXT NOT NULL,draft_hash TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind='preparation_record'),UNIQUE(run_id,vacancy_id));
      CREATE TABLE IF NOT EXISTS follow_ups(tenant_id TEXT REFERENCES organizations(id),run_id TEXT REFERENCES agent_runs(id),vacancy_id TEXT NOT NULL,due_at TEXT NOT NULL,action TEXT NOT NULL,PRIMARY KEY(run_id,vacancy_id));
      CREATE TABLE IF NOT EXISTS audit_events(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id TEXT NOT NULL,actor_id TEXT NOT NULL,run_id TEXT,action TEXT NOT NULL,at TEXT NOT NULL,details TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS idempotency(tenant_id TEXT,key TEXT,request_hash TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(tenant_id,key));`);
  }
  close() { if (this.db.isOpen) this.db.close(); }
  transaction<T>(fn: () => T): T { this.db.exec('BEGIN IMMEDIATE'); try { const value = fn(); this.db.exec('COMMIT'); return value; } catch (error) { this.db.exec('ROLLBACK'); throw error; } }
  audit(principal: Principal, action: string, runId: string | null = null, details: unknown = {}) {
    this.db.prepare('INSERT INTO audit_events(tenant_id,actor_id,run_id,action,at,details) VALUES(?,?,?,?,?,?)').run(principal.tenantId, principal.userId, runId, action, new Date().toISOString(), JSON.stringify(details));
  }
  credentials(input: unknown) { return z.object({ email: z.string().email().max(254), password: z.string().min(12).max(128) }).parse(input); }
  register(input: unknown) {
    const credentials = this.credentials(input); const email = credentials.email.toLowerCase();
    const userId = randomUUID(), tenantId = randomUUID(), salt = randomBytes(16).toString('hex');
    const hash = scryptSync(credentials.password, salt, 64).toString('hex');
    return this.transaction(() => {
      if (this.db.prepare('SELECT id FROM users WHERE email=?').get(email)) throw new ApiError(409, 'Account cannot be created with these details.');
      this.db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(userId,email,hash,salt);
      this.db.prepare('INSERT INTO organizations VALUES(?,?)').run(tenantId,userId);
      this.db.prepare('INSERT INTO memberships VALUES(?,?,?)').run(tenantId,userId,'owner');
      this.db.prepare('INSERT INTO workspaces(tenant_id,payload) VALUES(?,?)').run(tenantId,JSON.stringify(emptyWorkspace));
      const principal: Principal = { userId, tenantId, role: 'owner' }; this.audit(principal,'account.created');
      return this.issueSession(principal,email);
    });
  }
  login(input: unknown) {
    const credentials = this.credentials(input); const email = credentials.email.toLowerCase();
    const row = this.db.prepare('SELECT * FROM users WHERE email=?').get(email) as { id: string; salt: string; password_hash: string } | undefined;
    const computed = scryptSync(credentials.password,row?.salt || 'missing-user-fixed-salt',64);
    if (!row || !timingSafeEqual(computed,Buffer.from(row.password_hash,'hex'))) throw new ApiError(401,'Email or password is incorrect.');
    const membership = this.db.prepare('SELECT tenant_id,role FROM memberships WHERE user_id=? ORDER BY tenant_id LIMIT 1').get(row.id) as { tenant_id: string; role: Principal['role'] };
    return this.issueSession({ userId: row.id, tenantId: membership.tenant_id, role: membership.role },email);
  }
  issueSession(principal: Principal, email: string) {
    const token = randomBytes(32).toString('hex'), csrf = randomBytes(24).toString('hex');
    this.db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run(digest(token),principal.userId,principal.tenantId,csrf,Date.now() + 8 * 3600000);
    return { token, csrf, email, principal };
  }
  session(token: string): Session {
    const row = this.db.prepare(`SELECT s.user_id,s.tenant_id,s.csrf,u.email,m.role FROM sessions s JOIN users u ON u.id=s.user_id JOIN memberships m ON m.user_id=s.user_id AND m.tenant_id=s.tenant_id WHERE s.token_hash=? AND s.expires>?`).get(digest(token),Date.now()) as { user_id: string; tenant_id: string; csrf: string; email: string; role: Principal['role'] } | undefined;
    if (!row) throw new ApiError(401,'Sign in to continue.');
    return { principal: { userId: row.user_id, tenantId: row.tenant_id, role: row.role }, csrf: row.csrf, email: row.email };
  }
  logout(token: string) { this.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token)); }
  workspace(principal: Principal) {
    const row = this.db.prepare('SELECT payload,revision FROM workspaces WHERE tenant_id=?').get(principal.tenantId) as { payload: string; revision: number };
    return { state: workspaceSchema.parse(JSON.parse(row.payload)), revision: row.revision };
  }
  saveWorkspace(principal: Principal, input: unknown) {
    if (principal.role === 'viewer') throw new ApiError(403,'Access denied.');
    const parsed = z.object({ state: workspaceSchema, revision: z.number().int().min(0) }).parse(input);
    return this.transaction(() => {
      const previous = this.workspace(principal);
      if (previous.revision !== parsed.revision) throw new ApiError(409,'Workspace changed. Reload before saving.');
      if (parsed.state.profile) parsed.state.profile.id = previous.state.profile?.id || randomUUID();
      this.db.prepare('UPDATE workspaces SET payload=?,revision=revision+1 WHERE tenant_id=?').run(JSON.stringify(parsed.state),principal.tenantId);
      this.audit(principal,'workspace.saved'); return this.workspace(principal);
    });
  }
  targets(principal: Principal): Targets | null {
    const row = this.db.prepare('SELECT payload FROM target_radar WHERE tenant_id=?').get(principal.tenantId) as { payload: string } | undefined;
    return row ? targetSchema.parse(JSON.parse(row.payload)) : null;
  }
  saveTargets(principal: Principal, input: unknown) {
    if (principal.role === 'viewer') throw new ApiError(403,'Access denied.');
    const targets = targetSchema.parse(input);
    if (!targets.companies.some(company => company.enabled)) throw new ApiError(400,'Choose at least one company.');
    const expected = { meridian: 'Demo Meridian', horizon: 'Demo Horizon' };
    if (targets.companies.some(company => expected[company.id] !== company.name)) throw new ApiError(400,'Invalid source binding.');
    this.transaction(() => {
      this.db.prepare('INSERT INTO target_radar VALUES(?,?) ON CONFLICT(tenant_id) DO UPDATE SET payload=excluded.payload').run(principal.tenantId,JSON.stringify(targets));
      this.audit(principal,'radar.consent_saved',null,{ companies: targets.companies.map(c => c.id) });
    });
    return targets;
  }
  runs(principal: Principal): AgentRun[] {
    return (this.db.prepare('SELECT payload FROM agent_runs WHERE tenant_id=? AND user_id=? ORDER BY created_at DESC').all(principal.tenantId,principal.userId) as { payload: string }[]).map(row => JSON.parse(row.payload));
  }
  run(principal: Principal, id: string): AgentRun {
    const row = this.db.prepare('SELECT payload FROM agent_runs WHERE id=? AND tenant_id=? AND user_id=?').get(id,principal.tenantId,principal.userId) as { payload: string } | undefined;
    if (!row) throw new ApiError(404,'Run not found.');
    const run = JSON.parse(row.payload) as AgentRun; authorize(principal,run); return run;
  }
  cached(principal: Principal, key: string, input: unknown): AgentRun | undefined {
    if (!/^[a-zA-Z0-9_-]{8,120}$/.test(key)) throw new ApiError(400,'Valid idempotency key required.');
    const row = this.db.prepare('SELECT request_hash,result FROM idempotency WHERE tenant_id=? AND key=?').get(principal.tenantId,principal.userId+':'+key) as { request_hash: string; result: string } | undefined;
    if (row && row.request_hash !== digest(JSON.stringify(input))) throw new ApiError(409,'Idempotency key already used for another command.');
    return row ? JSON.parse(row.result) : undefined;
  }
  cache(principal: Principal, key: string, input: unknown, run: AgentRun) {
    this.db.prepare('INSERT INTO idempotency VALUES(?,?,?,?)').run(principal.tenantId,principal.userId+':'+key,digest(JSON.stringify(input)),JSON.stringify(run));
  }
  createRun(principal: Principal, input: unknown, key: string): AgentRun {
    if (principal.role === 'viewer') throw new ApiError(403,'Access denied.');
    const command = z.object({ goal: z.string().trim().min(5).max(500) }).parse(input);
    const request = { kind: 'create', ...command }; const cached = this.cached(principal,key,request); if (cached) return cached;
    if (!this.workspace(principal).state.profile || !this.targets(principal)?.consent) throw new ApiError(400,'Save a profile and consented targets first.');
    return this.transaction(() => {
      const count = this.db.prepare('SELECT count(*) AS n FROM agent_runs WHERE tenant_id=? AND created_at>?').get(principal.tenantId,new Date(Date.now()-86400000).toISOString()) as { n: number };
      if (count.n >= 20) throw new ApiError(429,'Daily local run limit reached.');
      const run: AgentRun = { id: randomUUID(), userId: principal.userId, tenantId: principal.tenantId, goal: command.goal, state: 'created', plan: [], checkpoints: [], drafts: [], rejectedSources: [], duplicates: 0, revision: 0, expiresAt: new Date(Date.now()+86400000).toISOString(), budgetCents: 0, usage: zeroUsage(), approvedHashes: [], receipts: [], followUps: [] };
      run.checkpoints.push({ state:'created',step:'goal',at:new Date().toISOString(),usage:zeroUsage() });
      this.db.prepare('INSERT INTO agent_runs VALUES(?,?,?,?,?,?)').run(run.id,run.tenantId,run.userId,JSON.stringify(run),0,new Date().toISOString());
      this.db.prepare('INSERT INTO agent_checkpoints VALUES(?,?,?,?)').run(run.id,0,'created',new Date().toISOString());
      this.audit(principal,'agent.created',run.id); this.cache(principal,key,request,run); return run;
    });
  }
  async command(principal: Principal, id: string, input: unknown, key: string): Promise<AgentRun> {
    const command = z.object({ action: z.enum(['advance','approve','pause','resume','cancel']), revision: z.number().int().nonnegative(), draftHashes: z.array(z.string()).optional() }).parse(input);
    const request = { id, ...command }; const cached = this.cached(principal,key,request); if (cached) return cached;
    const run = this.run(principal,id);
    if (run.revision !== command.revision) throw new ApiError(409,'Run changed. Reload the latest checkpoint.');
    if (terminal(run.state)) throw new ApiError(409,'Run is already terminal.');
    const prior = run.state;
    if (Date.parse(run.expiresAt) <= Date.now()) run.state = 'expired';
    else if (command.action === 'cancel') run.state = 'cancelled';
    else if (command.action === 'pause' && !['paused','awaiting_approval'].includes(run.state)) { run.pausedFrom = run.state; run.state = 'paused'; }
    else if (command.action === 'resume' && run.state === 'paused') { run.state = run.pausedFrom || 'ready'; delete run.pausedFrom; }
    else if (command.action === 'approve' && run.state === 'awaiting_approval') {
      if (run.drafts.length === 0 || JSON.stringify(command.draftHashes?.slice().sort()) !== JSON.stringify(run.drafts.map(draft => draft.hash).sort())) throw new ApiError(400,'Approve the exact current draft versions.');
      run.approvalAt = new Date().toISOString(); run.approvedHashes = command.draftHashes!; run.state = 'executing';
    } else if (command.action === 'advance') {
      if (run.state === 'created') { run.state = 'planning'; }
      else if (run.state === 'planning') { run.plan = ['Read consented profile and targets','Discover mock vacancies','Verify provenance and freshness','Detect duplicates and reposts','Extract requirements and explain fit','Prepare evidence-only drafts','Request approval of exact draft versions','Record preparation and verify receipts','Schedule in-app review follow-ups']; run.state = 'ready'; }
      else if (run.state === 'ready') {
        const workspace = this.workspace(principal).state, targets = this.targets(principal);
        if (!workspace.profile || !targets?.consent) throw new ApiError(400,'Profile consent is required.');
        const records = await invokeTool(discoverTool,{ companies: targets.companies as TargetCompany[], now: new Date() },{ principal, runId: run.id, budgetCents: run.budgetCents, idempotencyKey: key });
        const accepted = records.filter(record => { const reason = verifySource(record,new Date()); if (reason) run.rejectedSources.push({ id: record.id,reason }); return !reason; });
        const deduped = deduplicate(accepted); run.duplicates = deduped.duplicates;
        run.drafts = deduped.vacancies.filter(vacancy => targets.roles.some(role => vacancy.title.toLowerCase().includes(role.toLowerCase()) || role.toLowerCase().includes(vacancy.title.toLowerCase()))).map(vacancy => prepareDraft(workspace.profile!,vacancy,targets.salary));
        run.state = run.drafts.length ? 'awaiting_approval' : 'failed';
        if (!run.drafts.length) run.error = 'No fresh permitted fixtures matched the selected roles. Adjust targets and create another run.';
      } else if (run.state === 'executing' && run.approvalAt) { authorizeAction('record_preparation',principal,run); run.state = 'verifying'; }
      else if (run.state === 'verifying') { run.state = 'completed'; }
      else throw new ApiError(409,'This checkpoint requires a different action.');
    } else throw new ApiError(409,'Action is invalid for this checkpoint.');
    run.revision++;
    run.checkpoints.push({ state: run.state, step: command.action, at: new Date().toISOString(), usage: zeroUsage() });
    return this.transaction(() => {
      const latest = this.run(principal,id); if (latest.revision !== command.revision) throw new ApiError(409,'Concurrent update. Reload the run.');
      if (prior === 'executing' && run.state === 'verifying') {
        run.receipts = run.drafts.map(draft => {
          const receipt = { id: randomUUID(), vacancyId: draft.vacancyId, kind: 'preparation_record' as const, verified: false };
          this.db.prepare('INSERT INTO action_receipts VALUES(?,?,?,?,?,?)').run(receipt.id,principal.tenantId,run.id,draft.vacancyId,draft.hash,receipt.kind); return receipt;
        });
      }
      if (run.state === 'completed') {
        run.receipts = run.receipts.map(receipt => {
          const row = this.db.prepare('SELECT draft_hash FROM action_receipts WHERE id=? AND run_id=? AND tenant_id=?').get(receipt.id,run.id,principal.tenantId) as { draft_hash: string } | undefined;
          if (!row || !run.approvedHashes.includes(row.draft_hash)) throw new ApiError(409,'Outcome verification failed.');
          return { ...receipt, verified: true };
        });
        run.followUps = run.receipts.map(receipt => ({ vacancyId: receipt.vacancyId, dueAt: new Date(Date.now()+3*86400000).toISOString(), action: 'Review preparation and confirm whether you want to proceed.' }));
        run.followUps.forEach(followUp => this.db.prepare('INSERT INTO follow_ups VALUES(?,?,?,?,?)').run(principal.tenantId,run.id,followUp.vacancyId,followUp.dueAt,followUp.action));
      }
      if (command.action === 'approve' && run.approvalAt) this.db.prepare('INSERT INTO approvals VALUES(?,?,?,?,?)').run(run.id,run.revision,principal.userId,JSON.stringify(run.approvedHashes),run.approvalAt);
      this.db.prepare('UPDATE agent_runs SET payload=?,revision=? WHERE id=? AND tenant_id=?').run(JSON.stringify(run),run.revision,run.id,principal.tenantId);
      this.db.prepare('INSERT INTO agent_checkpoints VALUES(?,?,?,?)').run(run.id,run.revision,run.state,new Date().toISOString());
      this.audit(principal,`agent.${command.action}`,run.id,{ from: prior, to: run.state, revision: run.revision, costCents: 0 });
      this.cache(principal,key,request,run); return run;
    });
  }
  auditLog(principal: Principal) { return this.db.prepare('SELECT id,run_id,action,at,details FROM audit_events WHERE tenant_id=? ORDER BY id DESC LIMIT 100').all(principal.tenantId); }
}
