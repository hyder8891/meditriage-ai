import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  name: string | null;
  email: string | null;
  role: "patient" | "clinician" | "admin";
  verified: boolean;
  emailVerified: boolean;
  licenseNumber?: string | null;
  specialty?: string | null;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User, refreshToken?: string) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist<AuthState>(
    (set: any) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token: string, user: User, refreshToken?: string) =>
        set({
          token,
          refreshToken: refreshToken || null,
          user,
          isAuthenticated: true,
        }),
      setToken: (token: string) =>
        set((state: AuthState) => ({
          ...state,
          token,
        })),
      clearAuth: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);

export function useAuth() {
  const { token, refreshToken, user, isAuthenticated, setAuth, setToken, clearAuth } = useAuthStore();

  console.log('[useAuth] Current state:', { token: token ? 'exists' : 'null', user, isAuthenticated });

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    isPatient: user?.role === "patient",
    isClinician: user?.role === "clinician",
    isAdmin: user?.role === "admin",
    setAuth,
    setToken,
    clearAuth,
    logout: clearAuth,
  };
}
