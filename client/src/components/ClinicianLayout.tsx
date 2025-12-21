import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Users, 
  Clock,
  Menu,
  Mic,
  FileImage,
  Calendar,
  Pill,
  MessageSquare,
  Bell,
  LogOut,
  FileText,
  TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ClinicianLayoutProps {
  children: ReactNode;
}

export function ClinicianLayout({ children }: ClinicianLayoutProps) {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, clearAuth } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: unreadCount } = trpc.clinical.getUnreadMessageCount.useQuery(
    { recipientId: user?.id || 0 },
    { enabled: !!user?.id, refetchInterval: 10000 }
  );

  const handleLogout = () => {
    clearAuth();
    toast.success("Logged out successfully");
    setLocation("/clinician/login");
  };

  // Redirect if not authenticated or not clinician/admin
  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'clinician')) {
    setLocation("/clinician/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar - Always visible, can collapse */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 overflow-y-auto ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            {sidebarOpen && (
              <img 
                src="/logo.png" 
                alt="My Doctor طبيبي" 
                className="h-12 w-auto" 
                style={{ imageRendering: '-webkit-optimize-contrast', objectFit: 'contain' }}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={sidebarOpen ? "ml-auto" : "mx-auto"}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          <nav className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-blue-50"
              onClick={() => setLocation("/clinician/dashboard")}
            >
              <Activity className="w-5 h-5 mr-3" />
              {sidebarOpen && "Dashboard"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-blue-50"
              onClick={() => setLocation("/clinician/reasoning")}
            >
              <TrendingUp className="w-5 h-5 mr-3" />
              {sidebarOpen && "Clinical Reasoning"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-blue-50"
              onClick={() => setLocation("/brain")}
            >
              <Activity className="w-5 h-5 mr-3" />
              {sidebarOpen && "BRAIN Analysis"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-blue-50"
              onClick={() => setLocation("/clinician/patients")}
            >
              <Users className="w-5 h-5 mr-3" />
              {sidebarOpen && "Patients"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-blue-50"
              onClick={() => setLocation("/clinician/reports")}
            >
              <FileText className="w-5 h-5 mr-3" />
              {sidebarOpen && "Reports"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-blue-50"
              onClick={() => setLocation("/clinician/live-scribe")}
            >
              <Mic className="w-5 h-5 mr-3" />
              {sidebarOpen && "Voice Input"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-blue-50"
              onClick={() => setLocation("/clinician/xray-analysis")}
            >
              <FileImage className="w-5 h-5 mr-3" />
              {sidebarOpen && "Medical Imaging"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-blue-50"
              onClick={() => setLocation("/clinician/calendar")}
            >
              <Calendar className="w-5 h-5 mr-3" />
              {sidebarOpen && "Calendar"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-blue-50"
              onClick={() => setLocation("/clinician/medications")}
            >
              <Pill className="w-5 h-5 mr-3" />
              {sidebarOpen && "Medications"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-blue-50 relative"
              onClick={() => setLocation("/clinician/messages")}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              {sidebarOpen && "Messages"}
              {unreadCount && unreadCount > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </nav>

          <div className="absolute bottom-4 left-0 right-0 px-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              {sidebarOpen && "Logout"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {children}
      </main>
    </div>
  );
}
