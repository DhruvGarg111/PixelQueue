import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

type RequestOptions = RequestInit & { retryOnAuth?: boolean };

async function refreshTokens() {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) {
    clear();
    return null;
  }
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    clear();
    return null;
  }
  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data.access_token as string;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, clear } = useAuthStore.getState();
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && options.retryOnAuth !== false) {
    const token = await refreshTokens();
    if (!token) {
      throw new Error("unauthorized");
    }
    return apiRequest<T>(path, { ...options, retryOnAuth: false });
  }

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      clear();
    }
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

export { API_URL };

