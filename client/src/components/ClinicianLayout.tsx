import { ReactNode, useEffect, useState } from "react";
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
  ChevronRight,
  Menu,
  X,
  Home,
  Stethoscope,
  BookOpen
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const menuItems = [
    { icon: Activity, label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', path: '/clinician/dashboard' },
    { icon: TrendingUp, label: language === 'ar' ? 'التشخيص السريري' : 'Clinical Reasoning', path: '/clinician/reasoning' },
    { icon: Pill, label: language === 'ar' ? 'حارس الأدوية' : 'PharmaGuard', path: '/clinician/pharmaguard' },
    { icon: Mic, label: language === 'ar' ? 'الكاتب الحي' : 'Live Scribe', path: '/clinician/live-scribe' },
    { icon: FileText, label: language === 'ar' ? 'نتائج التحاليل' : 'Lab Results', path: '/clinician/lab-results' },
    { icon: FileImage, label: language === 'ar' ? 'التصوير الطبي' : 'Medical Imaging', path: '/clinician/xray-analysis' },
    { icon: FileText, label: language === 'ar' ? 'التقارير الطبية' : 'Medical Reports', path: '/clinician/medical-reports' },
    { icon: BookOpen, label: language === 'ar' ? 'الأدبيات الطبية' : 'Medical Literature', path: '/medical-literature' },
    { icon: Calendar, label: language === 'ar' ? 'التقويم' : 'Calendar', path: '/clinician/calendar' },
    { icon: Pill, label: language === 'ar' ? 'الأدوية' : 'Medications', path: '/clinician/medications' },
    { icon: Users, label: language === 'ar' ? 'المرضى' : 'Patients', path: '/clinician/my-patients' },
    { icon: MessageSquare, label: language === 'ar' ? 'الرسائل' : 'Messages', path: '/clinician/messages', badge: unreadCount },
  ];

  // Bottom nav items for mobile (most important 4)
  const bottomNavItems = [
    { icon: Activity, label: language === 'ar' ? 'الرئيسية' : 'Home', path: '/clinician/dashboard' },
    { icon: Users, label: language === 'ar' ? 'المرضى' : 'Patients', path: '/clinician/my-patients' },
    { icon: MessageSquare, label: language === 'ar' ? 'الرسائل' : 'Messages', path: '/clinician/messages', badge: unreadCount },
    { icon: Stethoscope, label: language === 'ar' ? 'الأدوات' : 'Tools', path: '/clinician/reasoning' },
  ];

  const handleNavigation = (path: string) => {
    setLocation(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 h-14">
        <div className="flex items-center justify-between h-full px-3">
          <div className="flex items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-64 p-0">
                <div className="p-4">
                  <div className="mb-6 flex items-center justify-between">
                    <img 
                      src="/logo.png" 
                      alt="My Doctor طبيبي" 
                      className="h-10 w-auto" 
                      style={{ imageRendering: '-webkit-optimize-contrast', objectFit: 'contain' }}
                    />
                  </div>
                  <nav className="space-y-1">
                    {menuItems.map((item, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11 relative"
                        onClick={() => handleNavigation(item.path)}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 text-orange-700"
                      onClick={() => handleNavigation('/clinician/subscription')}
                    >
                      <Crown className="w-5 h-5" />
                      <span className="text-sm">{language === 'ar' ? 'الاشتراك' : 'Subscription'}</span>
                    </Button>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            <img 
              src="/logo.png" 
              alt="My Doctor طبيبي" 
              className="h-8 w-auto" 
              style={{ imageRendering: '-webkit-optimize-contrast', objectFit: 'contain' }}
            />
          </div>
          <UserProfileDropdown />
        </div>
      </div>

      {/* Desktop Sidebar - Collapsible with icon-only mode */}
      <aside className={`hidden lg:block fixed ${language === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} top-0 h-full bg-white border-gray-200 z-50 overflow-y-auto transition-all duration-300 ${
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

          <nav className="space-y-2 pb-24">
            {menuItems.map((item, idx) => (
              <Button
                key={idx}
                variant="ghost"
                className={`w-full relative ${
                  isCollapsed ? 'justify-center px-2' : 'justify-start'
                }`}
                onClick={() => setLocation(item.path)}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className={`w-5 h-5 ${
                  isCollapsed ? '' : (language === 'ar' ? 'ml-3' : 'mr-3')
                }`} />
                {!isCollapsed && item.label}
                {item.badge && item.badge > 0 && (
                  <span className={`absolute bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                    isCollapsed ? 'top-1 right-1' : 'top-2 right-2'
                  }`}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Button>
            ))}
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

          <div className={`fixed bottom-4 bg-white pt-3 border-t ${
            isCollapsed ? 'left-0 right-0 px-2' : (language === 'ar' ? 'right-0 left-auto w-64 px-4' : 'left-0 right-auto w-64 px-4')
          }`}>
            <UserProfileDropdown />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 pt-14 pb-16 lg:pt-0 lg:pb-0 ${
        language === 'ar' 
          ? (isCollapsed ? 'lg:mr-20' : 'lg:mr-64')
          : (isCollapsed ? 'lg:ml-20' : 'lg:ml-64')
      }`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-inset-bottom">
        <div className="grid grid-cols-4 h-16">
          {bottomNavItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNavigation(item.path)}
              className="flex flex-col items-center justify-center gap-1 relative active:bg-slate-50 transition-colors"
            >
              <item.icon className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge > 9 ? '9' : item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
