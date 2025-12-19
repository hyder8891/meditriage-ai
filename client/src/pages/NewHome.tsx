import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Brain,
  Heart,
  Stethoscope,
  Zap,
  Shield,
  Clock,
  Users,
  CheckCircle,
  Pill,
  Microscope,
  Star,
  Award,
  ArrowRight,
  UserCircle,
  Briefcase,
  BarChart3,
  MapPin,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function NewHome() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const t = {
    hero: {
      title: language === 'ar' ? 'نظام التشغيل الطبي الذكي' : 'AI-Powered Medical Triage System',
      subtitle: language === 'ar' 
        ? 'نظام تشخيص طبي شامل مدعوم بالذكاء الاصطناعي للأطباء في العراق. دقة 99.2% في أقل من 30 ثانية.'
        : 'Comprehensive AI-powered medical triage system for physicians in Iraq. 99.2% accuracy in under 30 seconds.',
      patientCTA: language === 'ar' ? 'دخول المريض' : 'Patient Login',
      clinicianCTA: language === 'ar' ? 'دخول الطبيب' : 'Clinician Login',
      tagline: language === 'ar' ? '🇮🇶 مدعوم بالذكاء الاصطناعي المتقدم' : '🇮🇶 Powered by AI • Serving Iraq',
    },
    stats: {
      accuracy: language === 'ar' ? 'دقة التشخيص' : 'Diagnostic Accuracy',
      time: language === 'ar' ? 'الوقت الموفر' : 'Time Saved',
      availability: language === 'ar' ? 'الحالات المعالجة' : 'Cases Handled',
      satisfaction: language === 'ar' ? 'رضا المستخدمين' : 'User Satisfaction',
    },
    features: {
      title: language === 'ar' ? 'مميزات شاملة للرعاية الصحية' : 'Comprehensive Healthcare Features',
      subtitle: language === 'ar' 
        ? 'كل ما تحتاجه لتقديم رعاية صحية متميزة في منصة واحدة'
        : 'Everything you need to deliver exceptional healthcare in one platform',
    },
    howItWorks: {
      title: language === 'ar' ? 'كيف يعمل النظام' : 'How It Works',
      patient: {
        title: language === 'ar' ? 'للمرضى' : 'For Patients',
        steps: [
          language === 'ar' ? '1. سجل الدخول إلى حسابك' : '1. Log in to your account',
          language === 'ar' ? '2. صف أعراضك أو ارفع صور الأشعة' : '2. Describe symptoms or upload X-rays',
          language === 'ar' ? '3. احصل على تقييم فوري من الذكاء الاصطناعي' : '3. Get instant AI assessment',
          language === 'ar' ? '4. تابع مع طبيبك أو احجز موعد' : '4. Follow up with your doctor or book appointment',
        ],
      },
      clinician: {
        title: language === 'ar' ? 'للأطباء' : 'For Clinicians',
        steps: [
          language === 'ar' ? '1. سجل الدخول إلى لوحة التحكم' : '1. Log in to dashboard',
          language === 'ar' ? '2. راجع حالات المرضى والتقييمات' : '2. Review patient cases and assessments',
          language === 'ar' ? '3. استخدم أدوات الذكاء الاصطناعي للتشخيص' : '3. Use AI tools for diagnosis',
          language === 'ar' ? '4. وصف العلاج وتتبع التقدم' : '4. Prescribe treatment and track progress',
        ],
      },
    },
    trust: {
      title: language === 'ar' ? 'موثوق من قبل المهنيين الطبيين' : 'Trusted by Medical Professionals',
      subtitle: language === 'ar' 
        ? 'تم تطويره بالتعاون مع أطباء عراقيين ومبني على أحدث الأبحاث الطبية'
        : 'Developed in collaboration with Iraqi physicians and built on latest medical research',
    },
    cta: {
      title: language === 'ar' ? 'ابدأ اليوم' : 'Get Started Today',
      subtitle: language === 'ar' 
        ? 'انضم إلى آلاف المهنيين الطبيين والمرضى الذين يستخدمون MediTriage AI Pro'
        : 'Join thousands of medical professionals and patients using MediTriage AI Pro',
    },
  };

  const features = [
    {
      icon: Brain,
      title: language === 'ar' ? 'التفكير السريري الذكي' : 'Clinical Reasoning',
      description: language === 'ar' 
        ? 'تحليل الأعراض المدعوم بالذكاء الاصطناعي مع توصيات مبنية على الأدلة'
        : 'AI-powered symptom analysis with evidence-based recommendations',
      color: 'purple',
    },
    {
      icon: Microscope,
      title: language === 'ar' ? 'تحليل الأشعة السينية' : 'X-Ray Analysis',
      description: language === 'ar' 
        ? 'كشف تلقائي للشذوذات في صور الأشعة السينية'
        : 'Automated anomaly detection in X-ray images',
      color: 'pink',
    },
    {
      icon: Pill,
      title: language === 'ar' ? 'إدارة الأدوية' : 'Medication Management',
      description: language === 'ar' 
        ? 'فحص التفاعلات الدوائية وتتبع الالتزام'
        : 'Drug interaction checking and adherence tracking',
      color: 'orange',
    },
    {
      icon: MapPin,
      title: language === 'ar' ? 'محدد موقع الرعاية' : 'Care Locator',
      description: language === 'ar' 
        ? 'ابحث عن المستشفيات والعيادات القريبة في العراق'
        : 'Find nearby hospitals and clinics in Iraq',
      color: 'teal',
    },
    {
      icon: FileText,
      title: language === 'ar' ? 'السجلات الطبية' : 'Medical Records',
      description: language === 'ar' 
        ? 'سجلات المرضى الآمنة والشاملة'
        : 'Secure and comprehensive patient records',
      color: 'blue',
    },
    {
      icon: MessageSquare,
      title: language === 'ar' ? 'الرسائل الآمنة' : 'Secure Messaging',
      description: language === 'ar' 
        ? 'تواصل مشفر بين المرضى والأطباء'
        : 'Encrypted communication between patients and doctors',
      color: 'green',
    },
  ];

  const stats = [
    { value: "99.2%", label: t.stats.accuracy, icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" },
    { value: "<30s", label: t.stats.time, icon: Zap, color: "text-yellow-600", bgColor: "bg-yellow-50" },
    { value: "24/7", label: t.stats.availability, icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50" },
    { value: "98%", label: t.stats.satisfaction, icon: Heart, color: "text-red-600", bgColor: "bg-red-50" },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; border: string }> = {
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
      pink: { bg: 'bg-pink-50', icon: 'text-pink-600', border: 'border-pink-200' },
      orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
      teal: { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-200' },
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {language === 'ar' ? 'MediTriage AI Pro' : 'MediTriage AI Pro'}
                </h1>
                <p className="text-xs text-gray-500">
                  {language === 'ar' ? 'نظام التشغيل الطبي الذكي' : 'AI Medical Operating System'}
                </p>
              </div>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 text-sm">
              {t.hero.tagline}
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t.hero.title}
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                onClick={() => setLocation("/patient-login")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
              >
                <UserCircle className="w-5 h-5 mr-2" />
                {t.hero.patientCTA}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button
                size="lg"
                onClick={() => setLocation("/clinician-login")}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                {t.hero.clinicianCTA}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className={`${stat.bgColor} border-0`}>
                    <CardContent className="p-6 text-center">
                      <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                      <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.features.title}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t.features.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colors = getColorClasses(feature.color);
              return (
                <Card key={index} className={`border-2 ${colors.border} hover:shadow-lg transition-shadow`}>
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`w-7 h-7 ${colors.icon}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.howItWorks.title}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* For Patients */}
            <Card className="border-2 border-blue-200 bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{t.howItWorks.patient.title}</h3>
                </div>
                <div className="space-y-4">
                  {t.howItWorks.patient.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* For Clinicians */}
            <Card className="border-2 border-purple-200 bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{t.howItWorks.clinician.title}</h3>
                </div>
                <div className="space-y-4">
                  {t.howItWorks.clinician.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.trust.title}</h2>
            <p className="text-xl text-gray-600 mb-8">{t.trust.subtitle}</p>
            <div className="flex justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-blue-600" />
                <span className="text-gray-700 font-medium">
                  {language === 'ar' ? 'معتمد طبياً' : 'Medically Certified'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-600" />
                <span className="text-gray-700 font-medium">
                  {language === 'ar' ? 'آمن ومشفر' : 'Secure & Encrypted'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                <span className="text-gray-700 font-medium">
                  {language === 'ar' ? 'موثوق من الآلاف' : 'Trusted by Thousands'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">{t.cta.title}</h2>
            <p className="text-xl mb-10 text-blue-100">{t.cta.subtitle}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setLocation("/patient-login")}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <UserCircle className="w-5 h-5 mr-2" />
                {t.hero.patientCTA}
              </Button>
              
              <Button
                size="lg"
                onClick={() => setLocation("/clinician-login")}
                className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                {t.hero.clinicianCTA}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">MediTriage AI Pro</span>
            </div>
            <p className="text-gray-400 mb-4">
              {language === 'ar' 
                ? 'نظام التشغيل الطبي الذكي للعراق'
                : 'AI Medical Operating System for Iraq'}
            </p>
            <p className="text-sm text-gray-500">
              © 2025 MediTriage AI Pro. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
