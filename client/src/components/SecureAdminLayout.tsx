import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { 
  LayoutDashboard, Users, UserCog, Activity, DollarSign, FileText, 
  Zap, Stethoscope, Syringe, Brain, Mic, FileSpreadsheet, 
  Cloud, CloudRain, Wind, MessageSquare, History, Building2, 
  Gavel, Settings as SettingsIcon, Phone, Key, UserPlus, 
  TestTube, ClipboardList, LogOut, Shield, Menu, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SecureAdminLayoutProps {
  children: ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navigationSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'User Management',
    items: [
      { label: 'Patients', path: '/admin/patients', icon: Users },
      { label: 'Doctors', path: '/admin/doctors', icon: UserCog },
    ]
  },
  {
    title: 'Analytics & Monitoring',
    items: [
      { label: 'Budget Tracking', path: '/admin/budget', icon: DollarSign },
      { label: 'Orchestration Logs', path: '/admin/orchestration', icon: FileText },
      { label: 'Load Testing', path: '/admin/load-test', icon: Activity },
      { label: 'Self-Healing', path: '/admin/self-healing', icon: Zap },
    ]
  },
  {
    title: 'Clinical Tools',
    items: [
      { label: 'Clinical Routers', path: '/admin/clinical', icon: Stethoscope },
      { label: 'Enhanced Triage', path: '/admin/triage', icon: Syringe },
      { label: 'Symptom Checker', path: '/admin/symptom-checker', icon: Brain },
      { label: 'Audio Analysis', path: '/admin/audio-symptom', icon: Mic },
      { label: 'Smart Forms', path: '/admin/smart-forms', icon: FileSpreadsheet },
    ]
  },
  {
    title: 'Patient Engagement',
    items: [
      { label: 'Wearables', path: '/admin/wearables', icon: Cloud },
      { label: 'Weather Alerts', path: '/admin/weather', icon: CloudRain },
      { label: 'Air Quality', path: '/admin/air-quality', icon: Wind },
      { label: 'Conversations', path: '/admin/conversations', icon: MessageSquare },
      { label: 'Chat History', path: '/admin/chat-history', icon: History },
    ]
  },
  {
    title: 'Business Features',
    items: [
      { label: 'B2B2C Portal', path: '/admin/b2b2c', icon: Building2 },
      { label: 'Resource Auction', path: '/admin/resource-auction', icon: Gavel },
      { label: 'Preferences', path: '/admin/preferences', icon: SettingsIcon },
    ]
  },
  {
    title: 'Auth & Onboarding',
    items: [
      { label: 'Phone Auth', path: '/admin/phone-auth', icon: Phone },
      { label: 'OAuth Config', path: '/admin/oauth', icon: Key },
      { label: 'Onboarding', path: '/admin/onboarding', icon: UserPlus },
    ]
  },
  {
    title: 'Lab & Testing',
    items: [
      { label: 'Lab Results', path: '/admin/lab-results', icon: TestTube },
      { label: 'Triage Queue', path: '/admin/triage-queue', icon: ClipboardList },
    ]
  },
];

export default function SecureAdminLayout({ children }: SecureAdminLayoutProps) {
  const { isAdminAuthenticated, adminLogout } = useAdminAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isAdminAuthenticated) {
      navigate('/admin/secret-login');
    }
  }, [isAdminAuthenticated, navigate]);

  if (!isAdminAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/secret-login');
  };

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-500" />
            <span className="font-bold text-white">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-6">
            {navigationSections.map((section) => (
              <div key={section.title}>
                <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-red-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              Logged in as <span className="text-white font-medium">admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
