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
import { useLanguage } from "@/contexts/LanguageContext";

interface ClinicianLayoutProps {
  children: ReactNode;
}

export function ClinicianLayout({ children }: ClinicianLayoutProps) {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, clearAuth } = useAuth();
  const { language } = useLanguage();
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
      <aside className={`fixed ${language === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} top-0 h-full bg-white border-gray-200 z-50 overflow-y-auto transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="p-4 relative">
          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute ${language === 'ar' ? '-left-3' : '-right-3'} top-6 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-100 transition-colors z-10 shadow-sm`}
            title={isCollapsed ? (language === 'ar' ? 'توسيع الشريط الجانبي' : 'Expand sidebar') : (language === 'ar' ? 'طي الشريط الجانبي' : 'Collapse sidebar')}
          >
            {isCollapsed ? (
              language === 'ar' ? <ChevronLeft className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              language === 'ar' ? <ChevronRight className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />
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
              title={isCollapsed ? (language === 'ar' ? 'لوحة التحكم' : 'Dashboard') : ''}
            >
              <Activity className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'لوحة التحكم' : 'Dashboard')}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/reasoning")}
              title={isCollapsed ? (language === 'ar' ? 'التشخيص السريري' : 'Clinical Reasoning') : ''}
            >
              <TrendingUp className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'التشخيص السريري' : 'Clinical Reasoning')}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/pharmaguard")}
              title={isCollapsed ? (language === 'ar' ? 'حارس الأدوية' : 'PharmaGuard') : ''}
            >
              <Pill className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'حارس الأدوية' : 'PharmaGuard')}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/live-scribe")}
              title={isCollapsed ? (language === 'ar' ? 'الكاتب الحي' : 'Live Scribe') : ''}
            >
              <Mic className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'الكاتب الحي' : 'Live Scribe')}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/lab-results")}
              title={isCollapsed ? (language === 'ar' ? 'نتائج التحاليل' : 'Lab Results') : ''}
            >
              <FileText className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'نتائج التحاليل' : 'Lab Results')}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/xray-analysis")}
              title={isCollapsed ? (language === 'ar' ? 'التصوير الطبي' : 'Medical Imaging') : ''}
            >
              <FileImage className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'التصوير الطبي' : 'Medical Imaging')}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/medical-reports")}
              title={isCollapsed ? (language === 'ar' ? 'التقارير الطبية' : 'Medical Reports') : ''}
            >
              <FileText className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'التقارير الطبية' : 'Medical Reports')}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/calendar")}
              title={isCollapsed ? (language === 'ar' ? 'التقويم' : 'Calendar') : ''}
            >
              <Calendar className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'التقويم' : 'Calendar')}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/medications")}
              title={isCollapsed ? (language === 'ar' ? 'الأدوية' : 'Medications') : ''}
            >
              <Pill className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'الأدوية' : 'Medications')}
            </Button>
            <Button
              variant="ghost"
              className={`w-full ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/my-patients")}
              title={isCollapsed ? (language === 'ar' ? 'المرضى' : 'Patients') : ''}
            >
              <Users className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'المرضى' : 'Patients')}
            </Button>
            <Button
              variant="ghost"
              className={`w-full relative ${
                isCollapsed ? 'justify-center px-2' : 'justify-start'
              }`}
              onClick={() => setLocation("/clinician/messages")}
              title={isCollapsed ? (language === 'ar' ? 'الرسائل' : 'Messages') : ''}
            >
              <MessageSquare className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'الرسائل' : 'Messages')}
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
              title={isCollapsed ? (language === 'ar' ? 'الاشتراك' : 'Subscription') : ''}
            >
              <Crown className={`w-5 h-5 ${
                isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
              }`} />
              {!isCollapsed && (language === 'ar' ? 'الاشتراك' : 'Subscription')}
            </Button>
          </nav>

          <div className={`absolute bottom-4 px-4 ${
            isCollapsed ? 'left-0 right-0' : (language === 'ar' ? 'left-4 right-4' : 'left-4 right-4')
          }`}>
            <UserProfileDropdown />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${
        language === 'ar' 
          ? (isCollapsed ? 'mr-20' : 'mr-64')
          : (isCollapsed ? 'ml-20' : 'ml-64')
      }`}>
        {children}
      </main>
    </div>
  );
}
