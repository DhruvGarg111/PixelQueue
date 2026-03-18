import { useAuthStore } from "../store/authStore";

const configuredApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (configuredApiUrl ?? "").replace(/\/+$/, "");

async function refreshSession() {
    const { clear } = useAuthStore.getState();
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
    });

    if (!response.ok) {
        clear();
        return false;
    }

    return true;
}

export async function apiRequest(path, options = {}) {
    const { clear } = useAuthStore.getState();
    const headers = new Headers(options.headers || {});
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

    if (!headers.has("Content-Type") && options.body && !isFormData) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        cache: options.cache ?? "no-store",
        credentials: "include",
    });

    const shouldRetryWithRefresh = (
        response.status === 401
        && options.retryOnAuth !== false
        && !path.startsWith("/api/v1/auth/")
    );

    if (shouldRetryWithRefresh) {
        const refreshed = await refreshSession();
        if (!refreshed) {
            throw new Error("unauthorized");
        }
        return apiRequest(path, { ...options, retryOnAuth: false });
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
        return {};
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        return await response.json();
    }

    return await response.text();
}

export { API_URL };
