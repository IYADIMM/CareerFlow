// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import { Store } from '../server/store';
import { apiServer } from '../server/index';
import { createTextDocument } from '../src/lib/intelligence';
let store: Store; let server: ReturnType<typeof apiServer>;
afterEach(async()=>{ await new Promise<void>(resolve=>server.close(()=>resolve())); store.close(); });
it('enforces auth, JSON validation, Origin, CSRF, logout and tenant isolation over HTTP',async()=>{
  store=new Store(':memory:'); server=apiServer(store); await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address(); if (!address || typeof address==='string') throw Error('Missing port');
  const base='http://127.0.0.1:'+address.port;
  const headers={ 'Content-Type':'application/json','Origin':'http://127.0.0.1:5173' };
  expect((await fetch(base+'/api/workspace')).status).toBe(401);
  const created=await fetch(base+'/api/auth/register',{ method:'POST',headers,body:JSON.stringify({ email:'api@example.test',password:'test-password-12345' }) }); expect(created.status).toBe(200);
  const cookie=created.headers.get('set-cookie')!.split(';')[0]; expect(created.headers.get('set-cookie')).toContain('HttpOnly');
  const session=await created.json() as { csrf: string };
  expect((await fetch(base+'/api/radar',{ method:'PUT',headers:{ ...headers,Cookie:cookie },body:'{}' })).status).toBe(403);
  expect((await fetch(base+'/api/radar',{ method:'PUT',headers:{ ...headers,Cookie:cookie,'X-CSRF-Token':session.csrf },body:'{}' })).status).toBe(400);
  expect((await fetch(base+'/api/auth/logout',{ method:'POST',headers:{ ...headers,Cookie:cookie,Origin:'https://evil.invalid','X-CSRF-Token':session.csrf } })).status).toBe(403);
  expect((await fetch(base+'/api/auth/logout',{ method:'POST',headers:{ ...headers,Cookie:cookie,'X-CSRF-Token':session.csrf } })).status).toBe(200);
  expect((await fetch(base+'/api/workspace',{ headers:{ Cookie:cookie } })).status).toBe(401);
});
it('protects exact-version downloads and rejects privileged API routes and forged ownership over HTTP',async()=>{
  store=new Store(':memory:');server=apiServer(store);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();if(!address||typeof address==='string')throw Error('Missing port');const base=`http://127.0.0.1:${address.port}`;
  const a=store.register({email:'download-a@example.test',password:'synthetic-password-123'}),b=store.register({email:'download-b@example.test',password:'synthetic-password-234'});
  const current=store.workspace(a.principal),doc={...createTextDocument('Approved CV','Synthetic text with dates 2020–2025. '.repeat(20)),verificationStatus:'verified' as const};store.saveWorkspace(a.principal,{state:{...current.state,documents:[doc]},revision:current.revision});
  const url=base+`/api/documents/${doc.id}/download`,headers={Cookie:`cf_session=${a.token}`};
  expect((await fetch(url)).status).toBe(401);expect((await fetch(url,{headers:{Cookie:`cf_session=${b.token}`}})).status).toBe(404);
  const downloaded=await fetch(url,{headers});expect(downloaded.status).toBe(200);expect(await downloaded.text()).toBe(doc.sourceText);expect(downloaded.headers.get('cache-control')).toContain('no-store');expect(downloaded.headers.get('x-request-id')).toBeTruthy();
  const mutation={...headers,Origin:'http://127.0.0.1:5173','Content-Type':'application/json','X-CSRF-Token':a.csrf};
  for(const path of ['/api/platform/owner','/api/platform/transfer','/api/memberships','/api/submit'])expect((await fetch(base+path,{method:'POST',headers:mutation,body:'{}'})).status).toBe(404);
  const latest=store.workspace(a.principal);expect((await fetch(base+'/api/workspace',{method:'PUT',headers:mutation,body:JSON.stringify({...latest,state:{...latest.state,organizationId:b.principal.tenantId}})})).status).toBe(400);
  store.db.prepare('DELETE FROM memberships WHERE user_id=?').run(a.principal.userId);expect((await fetch(url,{headers})).status).toBe(401);
});
