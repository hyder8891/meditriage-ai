import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "patient" | "clinician" | "admin";
  redirectTo?: string;
}

export function ProtectedRoute({ children, requiredRole, redirectTo }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  console.log('[ProtectedRoute] Auth state:', { isAuthenticated, user, requiredRole });

  useEffect(() => {
    // If not authenticated, redirect to home
    if (!isAuthenticated) {
      setLocation(redirectTo || "/");
      return;
    }

    // If role is required and user doesn't have it
    if (requiredRole && user?.role !== requiredRole) {
      // For admin routes, ONLY admins can access (no cross-access)
      if (requiredRole === "admin") {
        setLocation("/");
        return;
      }
      
      // For non-admin routes, admins can access all portals
      if (user?.role === "admin") {
        // Allow admin to access patient and clinician portals
        return;
      }
      
      // Redirect based on user role
      if (user?.role === "patient") {
        setLocation("/patient/portal");
      } else if (user?.role === "clinician") {
        setLocation("/clinician/dashboard");
      } else {
        setLocation("/");
      }
    }
  }, [isAuthenticated, user, requiredRole, redirectTo, setLocation]);

  // Show loading while checking auth
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show loading if role doesn't match (unless admin)
  if (requiredRole && user?.role !== requiredRole && user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
