import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  ArrowRight,
  UserCircle,
  Briefcase,
  BarChart3,
  MapPin,
  FileText,
  MessageSquare,
  Globe,
  Award,
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function MedHome() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const t = {
    hero: {
      badge: language === 'ar' ? '🇮🇶 مدعوم بالذكاء الاصطناعي المتقدم' : '🇮🇶 Powered by Advanced AI',
      title: language === 'ar' ? 'تبسيط إدارة المرضى بمنصة شاملة واحدة' : 'Simplify patient management with an all-in-one platform',
      subtitle: language === 'ar' ? 'مساعد الرعاية الصحية الذكي المدعوم بالتعاطف' : 'The Empathy-Driven AI Healthcare Assistant',
      patientCTA: language === 'ar' ? 'دخول المريض' : 'Patient Portal',
      clinicianCTA: language === 'ar' ? 'دخول الطبيب' : 'Clinician Portal',
    },
    business: {
      title: language === 'ar' ? 'حل واحد، نماذج أعمال متعددة' : 'One solution, multiple business models',
      models: [
        {
          title: language === 'ar' ? 'المستشفيات ومقدمو الرعاية' : 'Healthcare Providers',
          description: language === 'ar' 
            ? 'مساعدة صحية للمرضى ودعم متقدم للمهنيين. تبسيط رحلة الرعاية بمنصة ذكاء اصطناعي محادثة.'
            : 'Healthcare assistance for patients and advanced support for professionals. Streamline the care journey with a conversational AI platform.',
          icon: Stethoscope,
        },
        {
          title: language === 'ar' ? 'شركات التأمين الصحي' : 'Health Insurers',
          description: language === 'ar' 
            ? 'مساعدة صحية مبنية على الذكاء الاصطناعي لأعضائك في أي وقت وأي مكان. تحقيق توفير التكاليف وتحسين الموارد.'
            : 'AI-based healthcare assistance for your members anytime, anywhere. Achieve cost savings and resource optimization.',
          icon: Shield,
        },
        {
          title: language === 'ar' ? 'الصحة العامة والحكومات' : 'Public Health & Governments',
          description: language === 'ar' 
            ? 'معالجة الأنظمة المثقلة بالأعباء من خلال تعظيم الكفاءة. التعامل مع الطلب المتزايد بإدارة محسنة للوقت.'
            : 'Address overburdened systems by maximizing efficiency. Handle rising demand with improved time management.',
          icon: Globe,
        },
        {
          title: language === 'ar' ? 'صناعة الأدوية' : 'Pharma Industry',
          description: language === 'ar' 
            ? 'تحديد المرضى المشخصين خطأً أو غير المشخصين عبر الإنترنت. زيادة الالتزام بالعلاج بمساعد متابعة مبني على الذكاء الاصطناعي.'
            : 'Identify misdiagnosed or undiagnosed patients online. Increase treatment adherence with an AI-based follow-up assistant.',
          icon: Pill,
        },
      ],
    },
    why: {
      title: language === 'ar' ? 'لماذا My Doctor طبيبي' : 'Why My Doctor طبيبي',
      subtitle: language === 'ar' 
        ? 'ندعم المستخدمين طوال رحلة الرعاية الخاصة بهم'
        : 'We support users throughout their care journey',
      features: [
        {
          title: language === 'ar' ? 'التعاطف هو المستقبل' : 'Empathy is the future',
          description: language === 'ar' 
            ? 'مساعدنا المدعوم بالذكاء الاصطناعي يفهم احتياجات المرضى ويجيب على مخاوفهم. نجمع بين تقنية معالجة اللغة الطبيعية وواجهة شخصية.'
            : 'Our AI-powered assistant understands patients\' needs and answers their concerns. We combine NLP technology with a personal interface.',
          icon: Heart,
        },
        {
          title: language === 'ar' ? 'شكل منصتك الخاصة' : 'Shape your own platform',
          description: language === 'ar' 
            ? 'منصة SaaS قابلة للتخصيص بالكامل تتيح لك اختيار الخدمات التي تحتاجها وتخصيص الواجهة بعلامتك التجارية.'
            : 'Fully customizable SaaS platform allows you to select the services you need and customize the UI with your own branding.',
          icon: BarChart3,
        },
        {
          title: language === 'ar' ? 'تقنية يمكنك الوثوق بها' : 'A technology you can trust',
          description: language === 'ar' 
            ? 'نقدم حلاً تقنياً شفافاً وبديهياً. نلتزم بمعايير مراقبة الجودة الصارمة وحصلنا على أعلى مستويات الاعتماد.'
            : 'We offer a transparent and intuitive technology solution. We adhere to rigorous quality control standards and have obtained the highest levels of certification.',
          icon: Award,
        },
      ],
    },
    stats: {
      title: language === 'ar' ? 'تأثيرنا على نطاق عالمي' : 'Our impact on a global scale',
      items: [
        { value: '35+', label: language === 'ar' ? 'دولة' : 'Countries', icon: Globe },
        { value: '18', label: language === 'ar' ? 'لغة' : 'Languages', icon: MessageSquare },
        { value: '+50M', label: language === 'ar' ? 'حياة تم الوصول إليها' : 'Lives reached', icon: Users },
        { value: '99.2%', label: language === 'ar' ? 'دقة التشخيص' : 'Diagnostic Accuracy', icon: CheckCircle },
      ],
    },
    cta: {
      title: language === 'ar' ? 'ابدأ اليوم' : 'Get Started Today',
      subtitle: language === 'ar' 
        ? 'انضم إلى آلاف المهنيين الطبيين والمرضى الذين يستخدمون My Doctor طبيبي'
        : 'Join thousands of medical professionals and patients using My Doctor طبيبي',
      patientCTA: language === 'ar' ? 'دخول المريض' : 'Patient Login',
      clinicianCTA: language === 'ar' ? 'دخول الطبيب' : 'Clinician Login',
    },
  };

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">My Doctor طبيبي</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              {language === 'ar' ? 'المميزات' : 'Features'}
            </a>
            <a href="#why" className="text-sm font-medium hover:text-primary transition-colors">
              {language === 'ar' ? 'لماذا نحن' : 'Why Us'}
            </a>
            <a href="#impact" className="text-sm font-medium hover:text-primary transition-colors">
              {language === 'ar' ? 'التأثير' : 'Impact'}
            </a>
            <LanguageSwitcher />
            <Button 
              onClick={() => setLocation('/clinician-login')}
              className="bg-primary hover:bg-primary/90"
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </Button>
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm">
              <span className="text-sm font-medium">{t.hero.badge}</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              {t.hero.title}
            </h1>
            
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              {t.hero.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => setLocation('/patient-login')}
                className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <UserCircle className="mr-2 h-5 w-5" />
                {t.hero.patientCTA}
              </Button>
              <Button
                size="lg"
                onClick={() => setLocation('/clinician-login')}
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Briefcase className="mr-2 h-5 w-5" />
                {t.hero.clinicianCTA}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Business Models Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="container">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold mb-2">
              {language === 'ar' ? 'My Doctor طبيبي لأعمالك' : 'My Doctor طبيبي for your business'}
            </p>
            <h2 className="text-4xl font-bold">{t.business.title}</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.business.models.map((model, idx) => (
              <Card key={idx} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <model.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{model.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {model.description}
                  </p>
                  <button className="flex items-center text-primary font-semibold hover:gap-2 transition-all">
                    {language === 'ar' ? 'اعرف المزيد' : 'Learn more'}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section id="why" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold mb-2">
              {language === 'ar' ? 'لماذا My Doctor طبيبي' : 'Why My Doctor طبيبي'}
            </p>
            <h2 className="text-4xl font-bold mb-4">{t.why.title}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.why.subtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {t.why.features.map((feature, idx) => (
              <div key={idx} className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="impact" className="py-20 bg-primary/5">
        <div className="container">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold mb-2">
              {language === 'ar' ? 'بصمة My Doctor طبيبي' : 'My Doctor طبيبي\'s footprint'}
            </p>
            <h2 className="text-4xl font-bold">{t.stats.title}</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {t.stats.items.map((stat, idx) => (
              <div key={idx} className="text-center space-y-2">
                <stat.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-5xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">{t.cta.title}</h2>
            <p className="text-xl text-muted-foreground">{t.cta.subtitle}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => setLocation('/patient-login')}
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <UserCircle className="mr-2 h-5 w-5" />
                {t.cta.patientCTA}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation('/clinician-login')}
                className="border-2 text-lg px-8 py-6 rounded-xl hover:bg-slate-50 transition-all"
              >
                <Briefcase className="mr-2 h-5 w-5" />
                {t.cta.clinicianCTA}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-slate-50">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-bold">My Doctor طبيبي</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? '© 2024 My Doctor طبيبي. جميع الحقوق محفوظة.'
                : '© 2024 My Doctor طبيبي. All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
