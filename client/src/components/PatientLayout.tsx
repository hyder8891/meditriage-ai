import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { 
  Activity,
  Users,
  MessageSquare,
  Crown,
  FileText,
  Calendar,
  Heart,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { AppLogo } from "@/components/AppLogo";

interface PatientLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  title?: string;
}

export function PatientLayout({ children, showBackButton = true, title }: PatientLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Redirect if not authenticated or not patient
  if (!isAuthenticated || !user || (user.role !== 'patient')) {
    setLocation("/patient-login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isArabic ? 'رجوع' : 'Back'}
                </Button>
              )}
              <AppLogo href="/patient/portal" size="md" showText={true} />
              {title && (
                <h1 className="text-xl font-semibold text-gray-800 hidden md:block">
                  {title}
                </h1>
              )}
            </div>

            <div className="hidden md:flex items-center gap-1">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/patient/portal')}
                className={location === '/patient/portal' ? 'text-rose-600 bg-rose-50' : ''}
              >
                <Activity className="w-4 h-4 mr-2" />
                {isArabic ? 'لوحة التحكم' : 'Dashboard'}
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => setLocation('/patient/my-doctors')}
              >
                <Users className="w-4 h-4 mr-2" />
                {isArabic ? 'أطبائي' : 'My Doctors'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/patient/messages')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {isArabic ? 'الرسائل' : 'Messages'}
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/patient/subscription')}
                className="hidden sm:flex gap-2"
              >
                <Crown className="w-4 h-4" />
                {isArabic ? 'الاشتراك' : 'Subscription'}
              </Button>
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
