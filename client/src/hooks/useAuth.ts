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
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist<AuthState>(
    (set: any) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token: string, user: User) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          token: null,
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
  const { token, user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  return {
    token,
    user,
    isAuthenticated,
    isPatient: user?.role === "patient",
    isClinician: user?.role === "clinician",
    isAdmin: user?.role === "admin",
    setAuth,
    clearAuth,
  };
}
