/**
 * Bounds every persistence call from the client so a slow or unreachable
 * server can never hang the UI — pairs with the server-side connection
 * timeout in db/client.ts. Rejects (does not hang) once `timeoutMs` elapses.
 */
export function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}
