// Reference URLs are never fetched by this release. A future fetch adapter must
// additionally resolve every hop, reject private IPs after DNS, pin the address,
// and enforce redirect, timeout and response-size limits.
export function safeReferenceUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false;
    const host = url.hostname.toLowerCase();
    if (!host.includes('.') || host.endsWith('.') || host.includes(':') || /^\d+\./.test(host)) return false;
    return !/(^|\.)(localhost|local|internal|test|invalid)$/.test(host) && !host.endsWith('.localhost') && !host.endsWith('.local') && !host.endsWith('.internal') && !host.includes('metadata');
  } catch { return false; }
}
