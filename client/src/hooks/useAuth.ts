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
      setAuth: (token: string, user: User, refreshToken?: string) =>
        set({
          token,
          refreshToken: refreshToken || null,
          user,
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
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);

export function useAuth() {
  const { token, refreshToken, user, setAuth, setToken, clearAuth } = useAuthStore();

  // Compute isAuthenticated based on token and user existence
  const isAuthenticated = Boolean(token && user);

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
