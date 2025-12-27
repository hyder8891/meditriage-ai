import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain,
  Microscope,
  Activity,
  FileText,
  Search,
  Users,
  MessageSquare,
  Crown,
  TrendingUp,
  Calendar,
  Heart,

  ArrowRight,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,

  Plus,
  Menu,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { AppLogo } from "@/components/AppLogo";
import { OnboardingTour } from "@/components/OnboardingTour";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function PatientPortal() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { data: usage } = trpc.b2b2c.subscription.getUsageStats.useQuery();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Patient Tools - Removed clinical tools (X-Ray, Lab Interpretation)
  // Bio-Scanner (Optic-Vitals) is now available for patients
  const patientTools = [
    {
      icon: Heart,
      title: language === 'ar' ? 'قياس النبض' : 'Optic-Vitals',
      desc: language === 'ar' ? 'قياس معدل ضربات القلب بالكاميرا' : 'Measure heart rate with camera',
      color: 'from-red-500 to-rose-500',
      path: '/patient/bio-scanner',
    },
    {
      icon: Search,
      title: language === 'ar' ? 'ابحث عن عيادة' : 'Find Clinic',
      desc: language === 'ar' ? 'اعثر على أقرب مستشفى أو عيادة' : 'Find nearest hospital or clinic',
      color: 'from-blue-500 to-cyan-500',
      path: '/patient/care-locator',
    },
    {
      icon: FileText,
      title: language === 'ar' ? 'سجلاتي الطبية' : 'My Medical Records',
      desc: language === 'ar' ? 'عرض نتائج الفحوصات والتقارير' : 'View test results and reports',
      color: 'from-green-500 to-emerald-500',
      path: '/patient/medical-records',
    },
    {
      icon: Calendar,
      title: language === 'ar' ? 'مواعيدي' : 'My Appointments',
      desc: language === 'ar' ? 'إدارة المواعيد الطبية' : 'Manage medical appointments',
      color: 'from-purple-500 to-indigo-500',
      path: '/patient/appointments',
    },
  ];

  // Navigation items
  const navItems = [
    { icon: Activity, label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', path: '/patient/portal' },
    { icon: Search, label: language === 'ar' ? 'ابحث عن طبيب' : 'Find Doctors', path: '/patient/find-doctors' },
    { icon: Users, label: language === 'ar' ? 'أطبائي' : 'My Doctors', path: '/patient/my-doctors' },
    { icon: MessageSquare, label: language === 'ar' ? 'الرسائل' : 'Messages', path: '/patient/messages' },
    { icon: Crown, label: language === 'ar' ? 'الاشتراك' : 'Subscription', path: '/patient/subscription' },
  ];

  // Calculate usage percentage
  const usagePercentage = usage 
    ? (usage.consultationsUsed / usage.consultationsLimit) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <OnboardingTour />
      {/* Top Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="sm" className="px-2">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-64">
                  <div className="flex flex-col gap-2 mt-8">
                    {navItems.map((item, idx) => (
                      <Button
                        key={idx}
                        variant="ghost"
                        className="justify-start gap-3 h-12"
                        onClick={() => {
                          setLocation(item.path);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              <AppLogo href="/patient/portal" size="sm" showText={true} className="text-sm sm:text-base" />
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-1">
                <Button variant="ghost" className="text-rose-600 bg-rose-50">
                  <Activity className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                </Button>
                <Button variant="ghost" onClick={() => setLocation('/patient/find-doctors')}>
                  <Search className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'ابحث عن طبيب' : 'Find Doctors'}
                </Button>
                <Button variant="ghost" onClick={() => setLocation('/patient/my-doctors')}>
                  <Users className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'أطبائي' : 'My Doctors'}
                </Button>
                <Button variant="ghost" onClick={() => setLocation('/patient/messages')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'الرسائل' : 'Messages'}
                </Button>
                <Button variant="ghost" onClick={() => setLocation('/patient/subscription')}>
                  <Crown className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'الاشتراك' : 'Subscription'}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
              <Badge className="hidden sm:inline-flex bg-gradient-to-r from-rose-500 to-purple-500 text-white text-xs">
                {usage?.plan || 'Free'}
              </Badge>
              <div data-tour="language-switcher" className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              <div data-tour="profile-menu">
                <UserProfileDropdown />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
            {language === 'ar' ? 'مرحباً بك' : 'Welcome Back'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            {language === 'ar' 
              ? 'احصل على تقييم فوري أو تواصل مع أطبائك المختصين'
              : 'Get instant assessment or connect with your specialist doctors'}
          </p>
        </div>

        {/* Usage Stats Banner */}
        {usage && (
          <Card className="mb-4 sm:mb-6 md:mb-8 border-2 border-rose-100 bg-gradient-to-r from-rose-50 to-purple-50">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">
                    {language === 'ar' ? 'استخدام الاستشارات' : 'Consultation Usage'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {language === 'ar' 
                      ? `${usage.consultationsUsed} من ${usage.consultationsLimit} استشارة مستخدمة`
                      : `${usage.consultationsUsed} of ${usage.consultationsLimit} consultations used`}
                  </p>
                </div>
                {usagePercentage >= 80 && (
                  <Badge className="bg-orange-100 text-orange-700 text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {language === 'ar' ? 'قريب من الحد' : 'Near Limit'}
                  </Badge>
                )}
              </div>
              <Progress value={usagePercentage} className="h-2 sm:h-3 mb-3 sm:mb-4" />
              {usagePercentage >= 80 && (
                <Button 
                  size="sm" 
                  onClick={() => setLocation('/patient/subscription')}
                  className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-xs sm:text-sm w-full sm:w-auto"
                >
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {language === 'ar' ? 'ترقية الخطة' : 'Upgrade Plan'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {/* Start AI Assessment */}
          <Card data-tour="ai-assessment" className="border-2 hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer group pointer-events-auto" onClick={(e) => { e.stopPropagation(); setLocation('/symptom-checker'); }}>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">
                {language === 'ar' ? 'ابدأ التقييم الذكي' : 'Start AI Assessment'}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4">
                {language === 'ar' 
                  ? 'احصل على تحليل فوري لأعراضك باستخدام الذكاء الاصطناعي'
                  : 'Get instant analysis of your symptoms using AI'}
              </p>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{language === 'ar' ? 'أقل من 3 دقائق' : 'Less than 3 minutes'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Find Doctor */}
          <Card data-tour="find-doctor" className="border-2 hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer group pointer-events-auto" onClick={(e) => { e.stopPropagation(); setLocation('/patient/find-doctors'); }}>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">
                {language === 'ar' ? 'ابحث عن طبيب' : 'Find a Doctor'}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4">
                {language === 'ar' 
                  ? 'تصفح واختر من بين مئات الأطباء المعتمدين'
                  : 'Browse and choose from hundreds of certified doctors'}
              </p>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{language === 'ar' ? '500+ طبيب متاح' : '500+ doctors available'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Tools Grid */}
        <Card>
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  {language === 'ar' ? 'أدواتي' : 'My Tools'}
                </CardTitle>
                <p className="text-slate-600 text-xs sm:text-sm mt-1">
                  {language === 'ar' ? 'إدارة رعايتك الصحية' : 'Manage your healthcare'}
                </p>
              </div>
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {patientTools.map((tool, idx) => (
                <Card 
                  key={idx} 
                  data-tour={tool.path === '/patient/bio-scanner' ? 'bio-scanner' : undefined}
                  className="border-2 hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer group pointer-events-auto"
                  onClick={(e) => { e.stopPropagation(); setLocation(tool.path); }}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                      <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">{tool.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">{tool.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
