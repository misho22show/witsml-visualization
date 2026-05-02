const BASE = "http://localhost:8000";

export async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

export function postJSON<T>(path: string, body?: unknown): Promise<T> {
  return fetchJSON<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function wsUrl(path: string): string {
  return `ws://localhost:8000${path}`;
}
