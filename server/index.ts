import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ZodError } from 'zod';
import { ApiError, Store } from './store.ts';
import { randomUUID } from 'node:crypto';
const allowedOrigins = new Set(['http://127.0.0.1:5173','http://127.0.0.1:4173','http://localhost:5173']);
export function apiServer(store: Store) {
  const attempts = new Map<string, { count: number; reset: number }>();
  const respond = (res: ServerResponse, status: number, data: unknown) => { res.writeHead(status, { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' }); res.end(JSON.stringify(data)); };
  const body = async (req: IncomingMessage) => {
    if (!req.headers['content-type']?.startsWith('application/json')) throw new ApiError(415,'JSON content required.');
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 600000) throw new ApiError(413,'Request too large.'); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new ApiError(400,'Invalid JSON.'); }
  };
  return createServer(async (req,res) => {
    const requestId=randomUUID(); res.setHeader('X-Request-ID',requestId);
    try {
      const host = req.headers.host || ''; if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new ApiError(403,'Local host required.');
      const path = new URL(req.url || '/',`http://${host}`).pathname;
      if (req.method === 'GET' && path === '/api/health') return respond(res,200,{ mode:'authenticated-local', storage:'sqlite', externalActions:false });
      if (req.method !== 'GET' && !allowedOrigins.has(req.headers.origin || '')) throw new ApiError(403,'Request origin is not permitted.');
      if (path === '/api/auth/register' || path === '/api/auth/login') {
        if (req.method !== 'POST') throw new ApiError(405,'Method not allowed.');
        const bucketKey = req.socket.remoteAddress || 'local'; const bucket = attempts.get(bucketKey) || { count:0,reset:Date.now()+600000 };
        if (bucket.reset < Date.now()) { bucket.count=0; bucket.reset=Date.now()+600000; } bucket.count++; attempts.set(bucketKey,bucket);
        if (bucket.count>40) throw new ApiError(429,'Too many authentication attempts. Try later.');
        const input = await body(req); const session = path.endsWith('register') ? store.register(input) : store.login(input);
        res.setHeader('Set-Cookie',`cf_session=${session.token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=28800`);
        return respond(res,200,{ principal:session.principal,email:session.email,csrf:session.csrf });
      }
      const token = req.headers.cookie?.split(';').map(s => s.trim()).find(s => s.startsWith('cf_session='))?.slice(11) || '';
      const session = store.session(token);
      if (req.method === 'GET' && path === '/api/auth/session') return respond(res,200,session);
      if (req.method !== 'GET' && req.headers['x-csrf-token'] !== session.csrf) throw new ApiError(403,'Session verification failed.');
      if (req.method === 'POST' && path === '/api/auth/logout') { store.logout(token); res.setHeader('Set-Cookie','cf_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0'); return respond(res,200,{ signedOut:true }); }
      if (req.method === 'GET' && path === '/api/account/export') {
        const payload=store.exportAccount(session.principal);
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Content-Disposition':'attachment; filename="careerflow-account-export.json"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
        return res.end(JSON.stringify(payload,null,2));
      }
      if (req.method === 'POST' && path === '/api/account/delete') {
        const result=store.deleteAccount(session.principal,await body(req));
        res.setHeader('Set-Cookie','cf_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0');
        return respond(res,200,result);
      }
      if (path === '/api/workspace') {
        if (req.method === 'GET') return respond(res,200,store.workspace(session.principal));
        if (req.method === 'PUT') return respond(res,200,store.saveWorkspace(session.principal,await body(req)));
      }
      if (path === '/api/documents/tailor' && req.method==='POST') return respond(res,200,store.tailor(session.principal,await body(req)));
      const documentRoute=path.match(/^\/api\/documents\/([a-zA-Z0-9_-]+)\/download$/);
      if (documentRoute && req.method==='GET') {
        const document=store.document(session.principal,documentRoute[1]);
        res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="careerflow-approved.txt"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});
        return res.end(document.sourceText);
      }
      const trackRoute=path.match(/^\/api\/runs\/([0-9a-f-]{36})\/track$/);
      if (trackRoute && req.method==='POST') {
        const input=await body(req); if (typeof input?.vacancyId!=='string') throw new ApiError(400,'Select a prepared vacancy.');
        return respond(res,200,store.trackDraft(session.principal,trackRoute[1],input.vacancyId));
      }
      if (path === '/api/radar') {
        if (req.method === 'GET') return respond(res,200,store.targets(session.principal));
        if (req.method === 'PUT') return respond(res,200,store.saveTargets(session.principal,await body(req)));
      }
      if (req.method === 'GET' && path === '/api/audit') return respond(res,200,store.auditLog(session.principal));
      if (path === '/api/runs') {
        if (req.method === 'GET') return respond(res,200,store.runs(session.principal));
        if (req.method === 'POST') return respond(res,200,store.createRun(session.principal,await body(req),String(req.headers['idempotency-key'] || '')));
      }
      const runRoute = path.match(/^\/api\/runs\/([0-9a-f-]{36})$/);
      if (runRoute && req.method === 'GET') return respond(res,200,store.run(session.principal,runRoute[1]));
      if (runRoute && req.method === 'POST') return respond(res,200,await store.command(session.principal,runRoute[1],await body(req),String(req.headers['idempotency-key'] || '')));
      throw new ApiError(404,'Endpoint not found.');
    } catch (error) {
      const status = error instanceof ApiError ? error.status : error instanceof ZodError ? 400 : 500;
      respond(res,status,{ error: error instanceof ApiError ? error.message : status===400 ? 'Check the submitted fields.' : 'The request could not be completed.',requestId });
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  mkdirSync('.local',{ recursive:true }); const store = new Store('.local/careerflow.sqlite'); const server = apiServer(store);
  server.listen(8787,'127.0.0.1',() => process.stdout.write('CareerFlow development API: http://127.0.0.1:8787\n'));
  const shutdown = () => server.close(() => { store.close(); process.exit(0); }); process.on('SIGINT',shutdown); process.on('SIGTERM',shutdown);
}
