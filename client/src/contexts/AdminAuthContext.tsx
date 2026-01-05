import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
}

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  adminUser: AdminUser | null;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Use tRPC to check current auth status - returns the user object directly
  const { data: userData, isLoading: meLoading, refetch: refetchMe } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Admin login mutation
  const adminLoginMutation = trpc.auth.adminLogin.useMutation();
  
  // Logout mutation
  const logoutMutation = trpc.auth.logout.useMutation();

  // Check if user is admin on mount and when userData changes
  useEffect(() => {
    if (!meLoading) {
      // userData is the user object directly from ctx.user
      if (userData && userData.role && (userData.role === 'admin' || userData.role === 'super_admin')) {
        setIsAdminAuthenticated(true);
        setAdminUser({
          id: userData.id,
          email: userData.email || '',
          name: userData.name ?? null,
          role: userData.role,
        });
      } else {
        setIsAdminAuthenticated(false);
        setAdminUser(null);
      }
      setIsLoading(false);
    }
  }, [userData, meLoading]);

  const adminLogin = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Call the backend admin login endpoint
      const result = await adminLoginMutation.mutateAsync({
        username,
        password,
      });

      if (result.success && result.user) {
        // Verify the user has admin role
        if (result.user.role === 'admin' || result.user.role === 'super_admin') {
          setIsAdminAuthenticated(true);
          setAdminUser({
            id: result.user.id,
            email: result.user.email || '',
            name: result.user.name,
            role: result.user.role,
          });
          
          // Refetch me to ensure session is properly set
          await refetchMe();
          
          return { success: true };
        } else {
          // User authenticated but not an admin
          await logoutMutation.mutateAsync();
          return { success: false, error: 'Access denied. Admin privileges required.' };
        }
      }
      
      return { success: false, error: result.message || 'Login failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [adminLoginMutation, logoutMutation, refetchMe]);

  const adminLogout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Ignore logout errors
    } finally {
      setIsAdminAuthenticated(false);
      setAdminUser(null);
    }
  }, [logoutMutation]);

  return (
    <AdminAuthContext.Provider value={{ 
      isAdminAuthenticated, 
      isLoading, 
      adminUser, 
      adminLogin, 
      adminLogout 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
