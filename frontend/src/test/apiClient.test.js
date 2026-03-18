import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../api/client";
import { useAuthStore } from "../store/authStore";

function createJsonResponse(status, payload) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: () => "application/json",
        },
        json: vi.fn().mockResolvedValue(payload),
        text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
    };
}

describe("apiRequest", () => {
    beforeEach(() => {
        useAuthStore.setState({ me: { id: "user-1" }, bootstrapped: true });
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        useAuthStore.setState({ me: null, bootstrapped: false });
        vi.unstubAllGlobals();
    });

    it("retries once through refresh on unauthorized responses", async () => {
        fetch
            .mockResolvedValueOnce(createJsonResponse(401, { detail: "invalid authentication credentials" }))
            .mockResolvedValueOnce(createJsonResponse(200, { access_token: "rotated-token" }))
            .mockResolvedValueOnce(createJsonResponse(200, { ok: true }));

        const result = await apiRequest("/api/v1/projects");

        expect(fetch).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining("/api/v1/auth/refresh"),
            expect.objectContaining({ credentials: "include" }),
        );
        expect(result).toEqual({ ok: true });
    });

    it("clears session state if refresh fails", async () => {
        fetch
            .mockResolvedValueOnce(createJsonResponse(401, { detail: "invalid authentication credentials" }))
            .mockResolvedValueOnce(createJsonResponse(401, { detail: "refresh token required" }));

        await expect(apiRequest("/api/v1/projects")).rejects.toThrow("unauthorized");
        expect(useAuthStore.getState().me).toBeNull();
        expect(useAuthStore.getState().bootstrapped).toBe(true);
    });
});
