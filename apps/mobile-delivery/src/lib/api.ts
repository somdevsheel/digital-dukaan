import { API_URL } from "./config";
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from "./token-store";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: { nextCursor?: string | null; hasMore?: boolean };
}
interface ApiErrorEnvelope {
  error: { code: string; message: string; details?: Record<string, unknown> };
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const body = (await res.json()) as ApiSuccessEnvelope<{ accessToken: string; refreshToken: string }>;
        setAccessToken(body.data.accessToken);
        await setRefreshToken(body.data.refreshToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  idempotencyKey?: string;
  authenticated?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, idempotencyKey, authenticated = true, headers, ...rest } = options;

  const doFetch = async (): Promise<Response> => {
    const finalHeaders = new Headers(headers);
    finalHeaders.set("Content-Type", "application/json");
    if (idempotencyKey) finalHeaders.set("Idempotency-Key", idempotencyKey);
    if (authenticated) {
      const token = getAccessToken();
      if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${API_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  };

  let response = await doFetch();

  if (response.status === 401 && authenticated) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await doFetch();
    }
  }

  if (!response.ok) {
    let envelope: ApiErrorEnvelope | null = null;
    try {
      envelope = (await response.json()) as ApiErrorEnvelope;
    } catch {
      // Non-JSON error body — fall through to the generic message below.
    }
    throw new ApiError(
      envelope?.error.code ?? "INTERNAL_ERROR",
      envelope?.error.message ?? `Request failed with status ${response.status}`,
      response.status,
      envelope?.error.details,
    );
  }

  if (response.status === 204) return undefined as T;
  const parsed = (await response.json()) as ApiSuccessEnvelope<T>;
  return parsed.data;
}
