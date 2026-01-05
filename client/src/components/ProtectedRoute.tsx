import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "patient" | "clinician" | "admin";
  redirectTo?: string;
  /** If true, requires doctor verification for clinician routes */
  requireVerification?: boolean;
  /** If true, shows a warning banner instead of blocking access */
  softVerificationBlock?: boolean;
}

// Routes that don't require verification (verification page itself, profile, etc.)
const VERIFICATION_EXEMPT_ROUTES = [
  "/clinician/verification",
  "/doctor/verification",
  "/clinician/verification-old",
  "/clinician/profile",
  "/clinician/subscription",
];

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo,
  requireVerification = true,
  softVerificationBlock = false,
}: ProtectedRouteProps) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  // Get verification status for clinicians
  const { data: verificationStatus, isLoading: verificationLoading } = trpc.doctorVerification.getVerificationStatus.useQuery(
    undefined,
    {
      enabled: isAuthenticated && (user?.role === "clinician" || user?.role === "doctor") && requireVerification,
      staleTime: 30000,
    }
  );

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

  // Check verification for clinicians
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role !== "clinician" && user.role !== "doctor") return;
    if (!requireVerification) return;
    if (verificationLoading) return;
    
    // Check if current route is exempt from verification
    const isExemptRoute = VERIFICATION_EXEMPT_ROUTES.some(route => location.startsWith(route));
    if (isExemptRoute) return;
    
    // If not verified and not on exempt route, redirect to verification
    const isVerified = verificationStatus?.isVerified || verificationStatus?.adminVerified;
    if (!isVerified && !softVerificationBlock) {
      setLocation("/clinician/verification");
    }
  }, [isAuthenticated, user, verificationStatus, verificationLoading, requireVerification, softVerificationBlock, location, setLocation]);

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

  // Show loading while checking verification for clinicians
  if (
    requireVerification &&
    (user?.role === "clinician" || user?.role === "doctor") &&
    verificationLoading &&
    !VERIFICATION_EXEMPT_ROUTES.some(route => location.startsWith(route))
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground text-sm">جاري التحقق من حالة الحساب...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
