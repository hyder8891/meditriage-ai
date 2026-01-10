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
  Crown,
  TrendingUp,
  Calendar,
  Heart,
  BookOpen,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Menu,
  Pill,
  TestTube,
  FileSearch,
  Library,
  Stethoscope,
  HelpCircle,
  BarChart3,
  UsersRound,
  Scan,
  Camera,
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

  // Core Patient Tools
  const coreTools = [
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
  ];

  // AI Health Tools (Priority 1)
  const aiHealthTools = [
    {
      icon: Pill,
      title: language === 'ar' ? 'فحص التفاعلات الدوائية' : 'PharmaGuard',
      desc: language === 'ar' ? 'تحقق من تفاعلات الأدوية' : 'Check drug interactions',
      color: 'from-orange-500 to-amber-500',
      path: '/patient/pharmaguard',
    },
    {
      icon: TestTube,
      title: language === 'ar' ? 'شرح نتائج المختبر' : 'Lab Results Explainer',
      desc: language === 'ar' ? 'فهم نتائج تحاليلك' : 'Understand your lab results',
      color: 'from-cyan-500 to-teal-500',
      path: '/patient/lab-results',
    },
    {
      icon: FileSearch,
      title: language === 'ar' ? 'تحليل التقارير الطبية' : 'Report Analysis',
      desc: language === 'ar' ? 'الذكاء الاصطناعي يقرأ تقاريرك' : 'AI reads your medical reports',
      color: 'from-indigo-500 to-violet-500',
      path: '/patient/report-analysis',
    },
    {
      icon: Scan,
      title: language === 'ar' ? 'تحليل الصور الطبية' : 'Medical Imaging',
      desc: language === 'ar' ? 'تحليل الأشعة والصور الطبية' : 'Analyze X-rays, MRI, CT scans',
      color: 'from-purple-500 to-fuchsia-500',
      path: '/patient/medical-imaging',
    },
    {
      icon: Camera,
      title: language === 'ar' ? 'التقييم البصري' : 'Visual Assessment',
      desc: language === 'ar' ? 'ارفع صورة للجروح أو الطفح الجلدي' : 'Upload wound or rash photos for AI analysis',
      color: 'from-pink-500 to-rose-500',
      path: '/patient/visual-assessment',
    },
  ];

  // Health Education Tools (Priority 2)
  const educationTools = [
    {
      icon: Library,
      title: language === 'ar' ? 'مكتبة الأمراض' : 'Condition Library',
      desc: language === 'ar' ? 'تعرف على الأمراض والحالات' : 'Learn about diseases & conditions',
      color: 'from-emerald-500 to-green-500',
      path: '/patient/condition-library',
    },
    {
      icon: Stethoscope,
      title: language === 'ar' ? 'دليل العلاج' : 'Treatment Guide',
      desc: language === 'ar' ? 'ماذا تتوقع من العلاجات' : 'What to expect from treatments',
      color: 'from-pink-500 to-rose-500',
      path: '/patient/treatment-guide',
    },
    {
      icon: BookOpen,
      title: language === 'ar' ? 'الأبحاث الطبية' : 'Health Library',
      desc: language === 'ar' ? 'أبحاث طبية مبسطة' : 'Simplified medical research',
      color: 'from-blue-500 to-indigo-500',
      path: '/patient/health-library',
    },
  ];

  // Advanced Tools (Priority 3)
  const advancedTools = [
    {
      icon: HelpCircle,
      title: language === 'ar' ? 'تحضير رأي ثاني' : 'Second Opinion Prep',
      desc: language === 'ar' ? 'أسئلة لطبيب آخر' : 'Prepare questions for another doctor',
      color: 'from-violet-500 to-purple-500',
      path: '/patient/second-opinion-prep',
    },
    {
      icon: BarChart3,
      title: language === 'ar' ? 'مؤشر الصحة' : 'Health Score',
      desc: language === 'ar' ? 'تتبع صحتك العامة' : 'Track your overall wellness',
      color: 'from-teal-500 to-cyan-500',
      path: '/patient/health-score',
    },
    {
      icon: UsersRound,
      title: language === 'ar' ? 'سجلات العائلة' : 'Family Health Vault',
      desc: language === 'ar' ? 'إدارة سجلات أفراد العائلة' : 'Manage family members\' records',
      color: 'from-rose-500 to-pink-500',
      path: '/patient/family-vault',
    },
  ];

  // Combined for backward compatibility
  const patientTools = coreTools;

  // Navigation items
  const navItems = [
    { icon: Activity, label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', path: '/patient/portal' },

    { icon: BookOpen, label: language === 'ar' ? 'المكتبة الصحية' : 'Health Library', path: '/patient/health-library' },

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

                <Button variant="ghost" onClick={() => setLocation('/patient/health-library')}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'المكتبة الصحية' : 'Health Library'}
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
        <div className="mb-4 sm:mb-6 md:mb-8">
          {/* Start AI Assessment */}
          <Card data-tour="ai-assessment" className="border-2 hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer group pointer-events-auto" onClick={(e) => { e.stopPropagation(); setLocation('/patient/symptom-checker'); }}>
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
        </div>

        {/* Core Tools Grid */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  {language === 'ar' ? 'أدواتي الأساسية' : 'My Core Tools'}
                </CardTitle>
                <p className="text-slate-600 text-xs sm:text-sm mt-1">
                  {language === 'ar' ? 'إدارة رعايتك الصحية' : 'Manage your healthcare'}
                </p>
              </div>
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {coreTools.map((tool, idx) => (
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

        {/* AI Health Tools */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  {language === 'ar' ? 'أدوات الذكاء الاصطناعي' : 'AI Health Tools'}
                </CardTitle>
                <p className="text-slate-600 text-xs sm:text-sm mt-1">
                  {language === 'ar' ? 'تحليل ذكي لصحتك' : 'Smart analysis for your health'}
                </p>
              </div>
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {aiHealthTools.map((tool, idx) => (
                <Card 
                  key={idx} 
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

        {/* Health Education Tools */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  {language === 'ar' ? 'التثقيف الصحي' : 'Health Education'}
                </CardTitle>
                <p className="text-slate-600 text-xs sm:text-sm mt-1">
                  {language === 'ar' ? 'تعلم عن صحتك' : 'Learn about your health'}
                </p>
              </div>
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {educationTools.map((tool, idx) => (
                <Card 
                  key={idx} 
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

        {/* Advanced Tools */}
        <Card>
          <CardHeader className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl">
                  {language === 'ar' ? 'أدوات متقدمة' : 'Advanced Tools'}
                </CardTitle>
                <p className="text-slate-600 text-xs sm:text-sm mt-1">
                  {language === 'ar' ? 'ميزات إضافية لرعاية شاملة' : 'Extra features for comprehensive care'}
                </p>
              </div>
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {advancedTools.map((tool, idx) => (
                <Card 
                  key={idx} 
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
