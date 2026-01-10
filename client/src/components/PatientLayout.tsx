import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Activity,
  Users,
  Crown,
  FileText,
  Calendar,
  Heart,
  ArrowLeft,
  Stethoscope,
  Pill,
  BookOpen,
  Shield,
  Bell,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount] = useState(3); // TODO: Connect to real notification system

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

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/patient/portal')}
                className={location === '/patient/portal' ? 'text-rose-600 bg-rose-50' : ''}
              >
                <Activity className="w-4 h-4 mr-2" />
                {isArabic ? 'لوحة التحكم' : 'Dashboard'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/patient/symptom-checker')}
                className={location === '/patient/symptom-checker' ? 'text-rose-600 bg-rose-50' : ''}
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                {isArabic ? 'فحص الأعراض' : 'Symptom Checker'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/patient/appointments')}
                className={location === '/patient/appointments' ? 'text-rose-600 bg-rose-50' : ''}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {isArabic ? 'المواعيد' : 'Appointments'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/patient/medications')}
                className={location === '/patient/medications' ? 'text-rose-600 bg-rose-50' : ''}
              >
                <Pill className="w-4 h-4 mr-2" />
                {isArabic ? 'الأدوية' : 'Medications'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/patient/medical-records')}
                className={location === '/patient/medical-records' ? 'text-rose-600 bg-rose-50' : ''}
              >
                <FileText className="w-4 h-4 mr-2" />
                {isArabic ? 'السجلات' : 'Records'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/patient/medical-literature')}
                className={location === '/patient/medical-literature' ? 'text-rose-600 bg-rose-50' : ''}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {isArabic ? 'المكتبة الطبية' : 'Medical Library'}
              </Button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="relative hidden sm:flex"
                onClick={() => setLocation('/patient/notifications')}
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {notificationCount}
                  </span>
                )}
              </Button>
              
              {/* Subscription Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/patient/subscription')}
                className="hidden md:flex gap-2 border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <Crown className="w-4 h-4" />
                {isArabic ? 'الاشتراك' : 'Upgrade'}
              </Button>
              
              {/* User Profile */}
              <UserProfileDropdown />
              
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => {
                setLocation('/patient/portal');
                setMobileMenuOpen(false);
              }}
            >
              <Activity className="w-4 h-4 mr-3" />
              {isArabic ? 'لوحة التحكم' : 'Dashboard'}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => {
                setLocation('/patient/symptom-checker');
                setMobileMenuOpen(false);
              }}
            >
              <Stethoscope className="w-4 h-4 mr-3" />
              {isArabic ? 'فحص الأعراض' : 'Symptom Checker'}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => {
                setLocation('/patient/appointments');
                setMobileMenuOpen(false);
              }}
            >
              <Calendar className="w-4 h-4 mr-3" />
              {isArabic ? 'المواعيد' : 'Appointments'}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => {
                setLocation('/patient/medications');
                setMobileMenuOpen(false);
              }}
            >
              <Pill className="w-4 h-4 mr-3" />
              {isArabic ? 'الأدوية' : 'Medications'}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => {
                setLocation('/patient/medical-records');
                setMobileMenuOpen(false);
              }}
            >
              <FileText className="w-4 h-4 mr-3" />
              {isArabic ? 'السجلات' : 'Records'}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => {
                setLocation('/patient/medical-literature');
                setMobileMenuOpen(false);
              }}
            >
              <BookOpen className="w-4 h-4 mr-3" />
              {isArabic ? 'المكتبة الطبية' : 'Medical Library'}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => {
                setLocation('/patient/notifications');
                setMobileMenuOpen(false);
              }}
            >
              <Bell className="w-4 h-4 mr-3" />
              {isArabic ? 'الإشعارات' : 'Notifications'}
              {notificationCount > 0 && (
                <span className="ml-auto bg-rose-600 text-white text-xs rounded-full px-2 py-0.5">
                  {notificationCount}
                </span>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start border-rose-200 text-rose-600"
              onClick={() => {
                setLocation('/patient/subscription');
                setMobileMenuOpen(false);
              }}
            >
              <Crown className="w-4 h-4 mr-3" />
              {isArabic ? 'الاشتراك' : 'Upgrade to Premium'}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
