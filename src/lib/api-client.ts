let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
const tokenListeners = new Set<(t: string | null) => void>();

export function setAccessToken(t: string | null) {
  accessToken = t;
  for (const fn of tokenListeners) fn(t);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function onAccessTokenChange(fn: (t: string | null) => void): () => void {
  tokenListeners.add(fn);
  return () => tokenListeners.delete(fn);
}

async function doRefresh(): Promise<string | null> {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    setAccessToken(null);
    return null;
  }
  const data = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken as string;
}

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export interface ApiOptions extends RequestInit {
  retryOn401?: boolean;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { retryOn401 = true, headers, ...rest } = opts;
  const h = new Headers(headers);
  if (!h.has("Content-Type") && rest.body && typeof rest.body === "string") {
    h.set("Content-Type", "application/json");
  }
  if (accessToken) h.set("Authorization", `Bearer ${accessToken}`);

  let res = await fetch(path, { ...rest, headers: h, credentials: "include" });
  if (res.status === 401 && retryOn401) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      h.set("Authorization", `Bearer ${fresh}`);
      res = await fetch(path, { ...rest, headers: h, credentials: "include" });
    }
  }
  if (!res.ok) {
    const text = await res.text();
    let message = res.statusText;
    try {
      const parsed = JSON.parse(text);
      message = parsed.error ?? message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
