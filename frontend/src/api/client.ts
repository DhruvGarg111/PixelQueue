import { useAuthStore } from "../store/authStore";

const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;
const API_URL = (configuredApiUrl ?? "").replace(/\/+$/, "");

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
    let message = `HTTP ${response.status}`;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = await response.json().catch(() => null);
      const detail = payload?.detail;
      if (typeof detail === "string") {
        message = detail;
      } else if (detail && typeof detail === "object") {
        const innerMessage = typeof detail.message === "string" ? detail.message : null;
        const currentRevision = typeof detail.current_revision === "number" ? detail.current_revision : null;
        message = innerMessage || message;
        if (currentRevision !== null) {
          message += ` (current revision: ${currentRevision})`;
        }
      }
    } else {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    if (response.status === 401) {
      clear();
    }
    throw new Error(message);
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
