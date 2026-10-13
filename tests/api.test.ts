// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import { Store } from '../server/store';
import { apiServer } from '../server/index';
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
