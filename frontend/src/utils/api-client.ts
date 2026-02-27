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
    window.location.href = "/login";
    throw new ApiError(401, "Unauthorized");
  }

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
