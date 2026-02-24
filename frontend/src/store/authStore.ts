import { create } from "zustand";
import type { MeResponse } from "../types/domain";

const ACCESS_KEY = "annotation_access_token";
const REFRESH_KEY = "annotation_refresh_token";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  me: MeResponse | null;
  setTokens: (access: string, refresh: string) => void;
  setMe: (me: MeResponse | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem(ACCESS_KEY),
  refreshToken: localStorage.getItem(REFRESH_KEY),
  me: null,
  setTokens: (access, refresh) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    set({ accessToken: access, refreshToken: refresh });
  },
  setMe: (me) => set({ me }),
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    set({ accessToken: null, refreshToken: null, me: null });
  },
}));

