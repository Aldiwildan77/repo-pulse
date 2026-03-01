import { API_URL } from "./constants";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let isRefreshing = false;

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing) return false;
  isRefreshing = true;
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: HeadersInit = {
    ...(options.body != null && { "Content-Type": "application/json" }),
    ...options.headers,
  };

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // On 401, attempt token refresh once then retry
  if (response.status === 401 && path !== "/api/auth/refresh") {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });
    }
  }

  if (response.status === 401) {
    // Don't force redirect for auth-check endpoints — let the AuthProvider
    // handle unauthenticated state via ProtectedRoute navigation.
    if (path !== "/api/auth/me" && path !== "/api/auth/totp/verify-login") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized");
  }

  if (!response.ok) {
    const body = await response.text();
    let message = body || response.statusText;
    try {
      const parsed = JSON.parse(body);
      if (parsed.message) {
        message = parsed.message;
      } else if (parsed.error) {
        message = parsed.error;
      }
    } catch {
      // body is not JSON, use as-is
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
