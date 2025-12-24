import { useState, ReactNode, useEffect } from "react";
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
  Users,
  ChevronLeft,
  ChevronRight
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('clinician-sidebar-collapsed');
    return saved === 'true';
  });

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('clinician-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

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
      {/* Sidebar - Collapsible with icon-only mode */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 overflow-y-auto transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="p-4 relative">
          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-100 transition-colors z-10 shadow-sm"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>

          <div className="mb-8">
            <div className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'gap-3'
            }`}>
              {isCollapsed ? (
                <Activity className="w-8 h-8 text-blue-600" />
              ) : (
                <img 
                  src="/logo.png" 
                  alt="My Doctor طبيبي" 
                  className="h-14 w-auto" 
                  style={{ imageRendering: '-webkit-optimize-contrast', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>

          <nav className="space-y-2">
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/dashboard")}
              title={isCollapsed ? 'Dashboard' : ''}
            >
              <Activity className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'Dashboard'}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/reasoning")}
              title={isCollapsed ? 'Clinical Reasoning' : ''}
            >
              <TrendingUp className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'Clinical Reasoning'}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/pharmaguard")}
              title={isCollapsed ? 'PharmaGuard' : ''}
            >
              <Pill className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'PharmaGuard'}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/live-scribe")}
              title={isCollapsed ? 'Live Scribe' : ''}
            >
              <Mic className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'Live Scribe'}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/lab-results")}
              title={isCollapsed ? 'Lab Results' : ''}
            >
              <FileText className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'Lab Results'}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/xray-analysis")}
              title={isCollapsed ? 'Medical Imaging' : ''}
            >
              <FileImage className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'Medical Imaging'}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/medical-reports")}
              title={isCollapsed ? 'Medical Reports' : ''}
            >
              <FileText className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'Medical Reports'}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/calendar")}
              title={isCollapsed ? 'Calendar' : ''}
            >
              <Calendar className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'Calendar'}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/medications")}
              title={isCollapsed ? 'Medications' : ''}
            >
              <Pill className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'Medications'}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/my-patients")}
              title={isCollapsed ? 'Patients' : ''}
            >
              <Users className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'Patients'}
            </Button>
            <Button
              variant="ghost"
              className={`w-full relative ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/messages")}
              title={isCollapsed ? 'Messages' : ''}
            >
              <MessageSquare className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'Messages'}
              {unreadCount && unreadCount > 0 && (
                <span className={`absolute bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                  isCollapsed ? 'top-1 right-1' : 'top-2 right-2'
                }`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              className={`w-full bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 text-orange-700 ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/subscription")}
              title={isCollapsed ? 'Subscription' : ''}
            >
              <Crown className={`w-5 h-5 ${
                isCollapsed ? '' : 'mr-3'
              }`} />
              {!isCollapsed && 'Subscription'}
            </Button>
          </nav>

          <div className="absolute bottom-4 left-0 right-0 px-4">
            <UserProfileDropdown />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        isCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {children}
      </main>
    </div>
  );
}
