import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  email: string;
  [key: string]: unknown;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "auth-storage",
      // token is never persisted to localStorage — httpOnly cookie is the source of truth
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: (state) => {
        return () => {
          state.setHasHydrated(true);
        };
      },
    },
  ),
);
