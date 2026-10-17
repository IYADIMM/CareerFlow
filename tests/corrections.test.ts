// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Store } from '../server/store';
import { emptyWorkspace, makeProfile, workspaceSchema,loadWorkspace } from '../src/lib/workspace';
import { createTextDocument,createVacancy,calculateMatch } from '../src/lib/intelligence';
import { safeReferenceUrl } from '../src/lib/safety';
import { backupDatabase,restoreDatabase } from '../server/operations';
import { authorizeAction } from '../packages/agent-policy';
import { deduplicate,fixtureSource,verifySource } from '../packages/agent-tools/careerflow';
import type { CareerFact } from '../src/types';
const stores:Store[]=[];
afterEach(()=>stores.splice(0).forEach(s=>s.close()));
function setup(path=':memory:'){
  const store=new Store(path);stores.push(store);const session=store.register({email:'fixture@example.test',password:'synthetic-password-12345'});
  const profile=makeProfile({displayName:'Synthetic Example',email:'fixture@example.test',currentRole:'Director',yearsExperience:10,targetRole:'Director',location:'Dubai',workMode:'hybrid',objective:'Lead a regional team',skills:['Negotiation']});
  store.saveWorkspace(session.principal,{state:{...structuredClone(emptyWorkspace),profile},revision:0});
  const put=(recipe:(s:ReturnType<typeof store.workspace>['state'])=>ReturnType<typeof store.workspace>['state'])=>{const current=store.workspace(session.principal);return store.saveWorkspace(session.principal,{state:recipe(current.state),revision:current.revision});};
  return {store,session,put};
}
describe('correction regression',()=>{
  it('rejects forged fields, profile reassignment, orphan and duplicate records',()=>{
    const {store,session,put}=setup(), current=store.workspace(session.principal);
    expect(()=>store.saveWorkspace(session.principal,{...current,state:{...current.state,ownerId:'other'}})).toThrow();
    expect(()=>put(s=>({...s,profile:{...s.profile!,id:'other'}}))).toThrow('identity');
    expect(()=>put(s=>({...s,applications:[{id:'a',vacancyId:'missing',status:'saved',nextAction:'review',updatedAt:new Date().toISOString()}]}))).toThrow();
    expect(()=>put(s=>({...s,profile:{...s.profile!,skills:[s.profile!.skills[0],s.profile!.skills[0]]}}))).toThrow();
    expect(()=>put(s=>({...s,profile:{...s.profile!,skills:[{...s.profile!.skills[0],id:'replaced'}]}}))).toThrow('identity');
  });
  it('denies forged tenant principals, same-tenant collaborators and revoked memberships',()=>{
    const {store,session}=setup();const other=store.register({email:'other@example.test',password:'synthetic-password-23456'});
    expect(()=>store.workspace({...session.principal,tenantId:other.principal.tenantId})).toThrow('Access denied');
    store.db.prepare('INSERT INTO memberships VALUES(?,?,?)').run(session.principal.tenantId,other.principal.userId,'member');
    expect(()=>store.workspace({...other.principal,tenantId:session.principal.tenantId})).toThrow('Access denied');
    store.db.prepare('DELETE FROM memberships WHERE user_id=?').run(session.principal.userId);
    expect(()=>store.session(session.token)).toThrow('Sign in');expect(()=>store.workspace(session.principal)).toThrow('Access denied');expect(()=>store.login({email:'fixture@example.test',password:'synthetic-password-12345'})).toThrow('revoked');
  });
  it('preserves fact identity/history, blocks locked edits and invalidates document approval',()=>{
    const {store,session,put}=setup();const source=createTextDocument('Master','Employment\n'+ 'User-provided employment evidence. '.repeat(8));
    put(s=>({...s,documents:[source]}));
    const fact:CareerFact={id:randomUUID(),category:'employment',text:'Example role, 2020–2024',status:'user_confirmed',locked:false,version:1,history:[],sourceDocumentId:source.id,sourceQuote:'User-provided employment evidence.'};
    put(s=>({...s,facts:[fact],documents:s.documents.map(d=>({...d,verificationStatus:'verified'}))}));
    const before=store.document(session.principal,source.id);expect(before.approvedVersion).toBe(1);
    const tailored=store.tailor(session.principal,{masterId:source.id,factIds:[fact.id],revision:store.workspace(session.principal).revision});
    expect(tailored.state.documents.find(d=>d.id===source.id)?.sourceText).toBe(source.sourceText);
    put(s=>({...s,facts:s.facts!.map(f=>({...f,text:'Example role, 2020–2025'}))}));
    const edited=store.workspace(session.principal).state.facts![0];expect(edited.id).toBe(fact.id);expect(edited.version).toBe(2);expect(edited.history[0].text).toBe(fact.text);
    put(s=>({...s,facts:s.facts!.map(f=>({...f,locked:true}))}));
    expect(()=>put(s=>({...s,facts:s.facts!.map(f=>({...f,text:'Altered locked dates'}))}))).toThrow('Unlock');
    put(s=>({...s,documents:s.documents.map(d=>d.id===source.id?{...d,sourceText:d.sourceText+'\nNew statement',verificationStatus:'verified'}:d)}));
    expect(()=>store.document(session.principal,source.id)).toThrow('approve');
    expect(store.workspace(session.principal).state.documents.find(d=>d.id===source.id)?.version).toBe(2);
  });
  it('rejects unsupported source quotes and derived facts in tailored documents',()=>{
    const {store,session,put}=setup();const doc=createTextDocument('Master','Career statement. '.repeat(20));put(s=>({...s,documents:[{...doc,verificationStatus:'verified'}]}));
    const fact:CareerFact={id:randomUUID(),category:'achievement',text:'Unconfirmed figure',status:'derived',locked:false,version:1,history:[]};put(s=>({...s,facts:[fact]}));
    expect(()=>store.tailor(session.principal,{masterId:doc.id,factIds:[fact.id],revision:store.workspace(session.principal).revision})).toThrow('user-confirmed');
    expect(()=>put(s=>({...s,facts:[{...fact,sourceDocumentId:doc.id,sourceQuote:'Invented source quote'}]}))).toThrow('Source quote');
  });
  it('requires legal state transitions and explicit submission confirmation, preserves history on retry',()=>{
    const {store,session,put}=setup();const vacancy=createVacancy({title:'Director',company:'Example',location:'Dubai',workMode:'hybrid',description:'This is a synthetic job description. '.repeat(10),requiredSkills:['Negotiation'],sourceUrl:'https://example.com/jobs/1'});
    const application={id:randomUUID(),vacancyId:vacancy.id,status:'saved' as const,nextAction:'Review',updatedAt:new Date().toISOString()};put(s=>({...s,vacancies:[vacancy],applications:[application]}));
    expect(()=>put(s=>({...s,applications:s.applications.map(a=>({...a,status:'applied'}))}))).toThrow('transition');
    for(const status of ['preparing','ready','approved'] as const)put(s=>({...s,applications:s.applications.map(a=>({...a,status}))}));
    expect(()=>put(s=>({...s,applications:s.applications.map(a=>({...a,status:'applied'}))}))).toThrow('confirmation');
    put(s=>({...s,applications:s.applications.map(a=>({...a,status:'applied',submission:{confirmed:true,at:new Date().toISOString(),evidence:'Synthetic receipt 42',documentVersions:[]}}))}));
    put(s=>s);expect(store.workspace(session.principal).state.applications[0].history).toHaveLength(4);
    expect(()=>put(s=>({...s,applications:[...s.applications,{...s.applications[0],id:'duplicate'}]}))).toThrow();
  });
  it('does not reward inferred or substring skills and leaves absent requirements unknown',()=>{
    const {store,session}=setup();const profile=store.workspace(session.principal).state.profile!;profile.skills[0].status='inferred';
    const vacancy=createVacancy({title:'Director',company:'Example',location:'Dubai',workMode:'hybrid',description:'Synthetic vacancy requirements for candidate review. '.repeat(4),requiredSkills:['Negotiation']});
    expect(calculateMatch(profile,vacancy).dimensions[0].score).toBe(0);
    expect(calculateMatch(profile,{...vacancy,requiredSkills:[]}).overallScore).toBeNull();
    profile.skills=[{id:'s',name:'JavaScript',status:'user_declared'}];expect(calculateMatch(profile,{...vacancy,requiredSkills:['Java']}).dimensions[0].score).toBe(0);
  });
  it('rejects malformed, internal and credential URLs without network retrieval',()=>{
    for(const url of ['javascript:alert(1)','http://example.com','https://127.0.0.1','https://2130706433','https://[::1]','https://169.254.169.254/latest','https://metadata.google.internal','https://localhost','https://a.local','https://user:pass@example.com'])expect(safeReferenceUrl(url),url).toBe(false);
    expect(safeReferenceUrl('https://example.com/careers?id=1')).toBe(true);
  });
  it('distinguishes reposts, expired sources and genuinely separate positions',()=>{
    const records=fixtureSource.discover([{id:'meridian',name:'Demo Meridian',source:'fixture',enabled:true}],new Date());
    const result=deduplicate(records);expect(result.decisions.some(d=>d.kind==='reposted')).toBe(true);
    expect(verifySource(records.find(r=>r.id==='demo-expired')!,new Date())).toContain('expired');
    expect(deduplicate([records[0],{...records[0],id:'different',sourceVacancyId:'different-opening'}]).vacancies).toHaveLength(2);
    expect(verifySource({...records[0],retrieval:'failed'},new Date())).toContain('failed');
  });
  it('binds agent approval to expiry/content and transfers completed drafts exactly once',async()=>{
    const {store,session}=setup();const p=session.principal;store.saveTargets(p,{mode:'companies',roles:['Unrelated role'],companies:[{id:'meridian',name:'Demo Meridian',source:'fixture',enabled:true}],consent:true});
    let run=store.createRun(p,{goal:'Prepare synthetic opportunities'},randomUUID());
    for(let i=0;i<3;i++)run=await store.command(p,run.id,{action:'advance',revision:run.revision},randomUUID());
    expect(run.inputHash).toHaveLength(64);expect(run.toolCalls).toHaveLength(1);expect(run.drafts).toHaveLength(1);
    run=await store.command(p,run.id,{action:'approve',revision:run.revision,draftHashes:run.drafts.map(d=>d.hash)},randomUUID());
    expect(()=>authorizeAction('record_preparation',p,{...run,approvalExpiresAt:'2000-01-01T00:00:00Z'})).toThrow('expired');
    expect(()=>authorizeAction('record_preparation',p,{...run,drafts:run.drafts.map(d=>({...d,text:'tampered'}))})).toThrow('changed');
    for(let i=0;i<2;i++)run=await store.command(p,run.id,{action:'advance',revision:run.revision},randomUUID());
    store.trackDraft(p,run.id,run.drafts[0].vacancyId);store.trackDraft(p,run.id,run.drafts[0].vacancyId);expect(store.workspace(p).state.applications).toHaveLength(1);expect(store.workspace(p).state.applications[0].status).toBe('saved');
  });
  it('handles legacy storage and rejects oversized inputs',()=>{
    const legacy={...emptyWorkspace};delete (legacy as Partial<typeof legacy>).documents;
    expect(workspaceSchema.parse(legacy).documents).toEqual([]);
    expect(loadWorkspace({getItem:()=>JSON.stringify({...emptyWorkspace,ownerId:'forged'})})).toEqual(emptyWorkspace);
    expect(()=>workspaceSchema.parse({...emptyWorkspace,documents:[{...createTextDocument('Test','a'.repeat(120)),sourceText:'a'.repeat(80001)}]})).toThrow();
  });
  it('restores a populated SQLite backup to an isolated database and revokes restored sessions',()=>{
    const directory=mkdtempSync(join(tmpdir(),'careerflow-restore-'));const live=join(directory,'live.sqlite'),backup=join(directory,'backup.sqlite'),restored=join(directory,'restored.sqlite');
    try{const {store,session,put}=setup(live);put(s=>({...s,documents:[{...createTextDocument('Long synthetic CV','Readable career text. '.repeat(2000)),verificationStatus:'verified'}]}));
      const before=store.workspace(session.principal);backupDatabase(live,backup);restoreDatabase(backup,restored);const recovered=new Store(restored);stores.push(recovered);
      expect(recovered.workspace(session.principal)).toEqual(before);expect(()=>recovered.session(session.token)).toThrow('Sign in');expect(()=>restoreDatabase(backup,restored)).toThrow('new isolated');
      expect(recovered.document(session.principal,before.state.documents[0].id).sourceText).toBe(before.state.documents[0].sourceText);store.close();recovered.close();
    }finally{rmSync(directory,{recursive:true,force:true});}
  });
});
