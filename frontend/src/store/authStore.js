import { create } from "zustand";

export const useAuthStore = create((set) => ({
    me: null,
    bootstrapped: false,
    setMe: (me) => set({ me, bootstrapped: true }),
    clear: () => set({ me: null, bootstrapped: true }),
    reset: () => set({ me: null, bootstrapped: false }),
}));
