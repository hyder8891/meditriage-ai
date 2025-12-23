import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Mic,
  FileImage,
  Calendar,
  Pill,
  MessageSquare,
  FileText,
  TrendingUp,
  Crown,
  Users
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

interface ClinicianLayoutProps {
  children: ReactNode;
}

export function ClinicianLayout({ children }: ClinicianLayoutProps) {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, clearAuth } = useAuth();

  const { data: unreadCount } = trpc.clinical.getUnreadMessageCount.useQuery(
    { recipientId: user?.id || 0 },
    { enabled: !!user?.id, refetchInterval: 10000 }
  );

  // Redirect if not authenticated or not clinician/admin
  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'clinician')) {
    setLocation("/clinician/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar - Matches ClinicianDashboard exactly */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 overflow-y-auto">
        <div className="p-4">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="My Doctor طبيبي" 
                className="h-14 w-auto" 
                style={{ imageRendering: '-webkit-optimize-contrast', objectFit: 'contain' }}
              />
            </div>
          </div>

          <nav className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/dashboard")}
            >
              <Activity className="w-5 h-5 mr-3" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/reasoning")}
            >
              <TrendingUp className="w-5 h-5 mr-3" />
              Clinical Reasoning
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/pharmaguard")}
            >
              <FileText className="w-5 h-5 mr-3" />
              PharmaGuard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/live-scribe")}
            >
              <Mic className="w-5 h-5 mr-3" />
              Live Scribe
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/lab-results")}
            >
              <FileText className="w-5 h-5 mr-3" />
              Lab Results
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/xray-analysis")}
            >
              <FileImage className="w-5 h-5 mr-3" />
              Medical Imaging
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/medical-reports")}
            >
              <FileText className="w-5 h-5 mr-3" />
              Medical Reports
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/calendar")}
            >
              <Calendar className="w-5 h-5 mr-3" />
              Calendar
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/medications")}
            >
              <Pill className="w-5 h-5 mr-3" />
              Medications
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setLocation("/clinician/my-patients")}
            >
              <Users className="w-5 h-5 mr-3" />
              Patients
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start relative"
              onClick={() => setLocation("/clinician/messages")}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              Messages
              {unreadCount && unreadCount > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 text-orange-700"
              onClick={() => setLocation("/clinician/subscription")}
            >
              <Crown className="w-5 h-5 mr-3" />
              Subscription
            </Button>
          </nav>

          <div className="absolute bottom-4 left-0 right-0 px-4">
            <UserProfileDropdown />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}
