export interface DevSession { principal: { userId: string; tenantId: string; role: string }; email: string; csrf: string }
let csrf = '';
export function setSession(session: DevSession | null) { csrf = session?.csrf || ''; }
export async function api<T>(path: string, method = 'GET', body?: unknown, key?: string): Promise<T> {
  const response = await fetch(`/api${path}`, { method, credentials: 'same-origin', headers: { 'Content-Type':'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(key ? { 'Idempotency-Key':key } : {}) }, ...(body === undefined ? {} : { body:JSON.stringify(body) }) });
  let result: T & { error?: string };
  try { result = await response.json(); } catch { throw new Error('Start the local API with npm run dev:api, then try again.'); }
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}
