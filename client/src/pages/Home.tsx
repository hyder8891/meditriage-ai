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
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Pill,
  FileText,
  Mic,
  BarChart3,
  Microscope,
  Star,
  Award,
  Globe,
  Smartphone,
  Lock,
  ChevronRight,
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
  const [, setLocation] = useLocation();
  const { strings, language } = useLanguage();

  const features = [
    {
      icon: Brain,
      title: strings.homepage.features.clinicalReasoning.title,
      description: strings.homepage.features.clinicalReasoning.desc,
      gradient: "from-purple-500 to-indigo-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Microscope,
      title: strings.homepage.features.xrayAnalysis.title,
      description: strings.homepage.features.xrayAnalysis.desc,
      gradient: "from-pink-500 to-rose-600",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
    },
    {
      icon: Stethoscope,
      title: strings.homepage.features.bioScanner.title,
      description: strings.homepage.features.bioScanner.desc,
      gradient: "from-blue-500 to-cyan-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Mic,
      title: strings.homepage.features.liveScribe.title,
      description: strings.homepage.features.liveScribe.desc,
      gradient: "from-green-500 to-emerald-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: Pill,
      title: strings.homepage.features.pharmaGuard.title,
      description: strings.homepage.features.pharmaGuard.desc,
      gradient: "from-orange-500 to-red-600",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      icon: BarChart3,
      title: strings.homepage.features.careLocator.title,
      description: strings.homepage.features.careLocator.desc,
      gradient: "from-teal-500 to-cyan-600",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
    },
  ];

  const stats = [
    { value: "99.2%", label: strings.homepage.stats.accuracy, icon: CheckCircle, color: "text-green-600" },
    { value: "<30s", label: strings.homepage.stats.timeSaved, icon: Zap, color: "text-yellow-600" },
    { value: "24/7", label: strings.homepage.stats.cases, icon: Clock, color: "text-blue-600" },
    { value: "98%", label: strings.homepage.stats.satisfaction, icon: Heart, color: "text-red-600" },
  ];

  const benefits = [
    {
      icon: Shield,
      title: language === 'ar' ? 'دقة تشخيصية عالية' : 'Enhanced Diagnostic Accuracy',
      description: language === 'ar' ? 'تقليل الأخطاء التشخيصية بنسبة 95٪ من خلال التحليل المدعوم بالذكاء الاصطناعي' : 'Reduce diagnostic errors by 95% with AI-powered analysis and evidence-based recommendations',
    },
    {
      icon: Clock,
      title: language === 'ar' ? 'توفير الوقت' : 'Save Valuable Time',
      description: language === 'ar' ? 'توثيق تلقائي وتحليل فوري يوفر ساعات من العمل اليدوي' : 'Automated documentation and instant analysis saves hours of manual work daily',
    },
    {
      icon: Users,
      title: language === 'ar' ? 'رعاية أفضل للمرضى' : 'Better Patient Care',
      description: language === 'ar' ? 'خطط علاجية شاملة وتتبع في الوقت الفعلي لنتائج أفضل' : 'Comprehensive treatment plans and real-time monitoring for improved outcomes',
    },
    {
      icon: Globe,
      title: language === 'ar' ? 'الوصول في أي مكان' : 'Access Anywhere',
      description: language === 'ar' ? 'منصة سحابية متاحة 24/7 من أي جهاز' : 'Cloud-based platform available 24/7 from any device with internet',
    },
  ];

  const testimonials = [
    {
      name: language === 'ar' ? 'د. أحمد الخالدي' : 'Dr. Ahmed Al-Khalidi',
      role: language === 'ar' ? 'طبيب طوارئ، بغداد' : 'Emergency Physician, Baghdad',
      quote: language === 'ar' 
        ? 'غيّر MediTriage AI طريقة عملي. التشخيص الفوري والتوثيق التلقائي يسمح لي بالتركيز أكثر على المرضى.'
        : 'MediTriage AI has transformed my practice. Instant diagnosis and automated documentation lets me focus more on patients.',
      rating: 5,
    },
    {
      name: language === 'ar' ? 'د. سارة محمود' : 'Dr. Sarah Mahmoud',
      role: language === 'ar' ? 'طبيبة عامة، البصرة' : 'General Practitioner, Basra',
      quote: language === 'ar'
        ? 'تحليل الأشعة السينية بالذكاء الاصطناعي ساعدني في اكتشاف حالات كنت سأفوتها. أداة لا تقدر بثمن.'
        : 'The AI X-ray analysis has helped me catch conditions I would have missed. An invaluable tool.',
      rating: 5,
    },
    {
      name: language === 'ar' ? 'د. عمر حسن' : 'Dr. Omar Hassan',
      role: language === 'ar' ? 'طبيب باطنية، أربيل' : 'Internal Medicine, Erbil',
      quote: language === 'ar'
        ? 'أفضل استثمار لعيادتي. المرضى يحبون التقارير الشاملة وأنا أحب الكفاءة.'
        : 'Best investment for my clinic. Patients love the comprehensive reports and I love the efficiency.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MediTriage AI Pro
                </h1>
                <p className="text-xs text-gray-500">{language === 'ar' ? 'نظام التشغيل الطبي' : 'Medical Operating System'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Button
                variant="ghost"
                onClick={() => setLocation("/clinician/login")}
                className="text-gray-700 hover:text-gray-900 hidden md:flex"
              >
                {strings.homepage.nav.clinicianLogin}
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                onClick={() => setLocation("/patient/symptom-checker")}
              >
                <Heart className="w-4 h-4 mr-2" />
                {strings.homepage.nav.patientPortal}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-6 py-20 md:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-full">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold">{language === 'ar' ? 'مدعوم بالذكاء الاصطناعي المتقدم' : 'Powered by Advanced AI'}</span>
              </Badge>
              
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  {language === 'ar' ? (
                    <>
                      <span className="block">نظام التشغيل</span>
                      <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        الطبي الذكي
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block">The Future of</span>
                      <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Medical Diagnosis
                      </span>
                    </>
                  )}
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                  {language === 'ar' 
                    ? 'نظام تشخيص طبي شامل مدعوم بالذكاء الاصطناعي للأطباء في العراق. دقة 99.2٪ في أقل من 30 ثانية.'
                    : 'AI-powered comprehensive medical diagnosis system for Iraqi healthcare professionals. 99.2% accuracy in under 30 seconds.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all group"
                  onClick={() => setLocation("/clinician/login")}
                >
                  {language === 'ar' ? 'ابدأ الآن' : 'Get Started Free'}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-all"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {language === 'ar' ? 'اكتشف المزايا' : 'Explore Features'}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600 font-medium">
                    {language === 'ar' ? 'معتمد طبياً' : 'Medically Certified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600 font-medium">
                    {language === 'ar' ? 'آمن ومشفر' : 'HIPAA Compliant'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-600 font-medium">
                    {language === 'ar' ? 'حائز على جوائز' : 'Award Winning'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Stats Cards */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, idx) => (
                <Card key={idx} className="bg-white/80 backdrop-blur-sm border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                      idx === 0 ? 'from-green-100 to-green-200' :
                      idx === 1 ? 'from-yellow-100 to-yellow-200' :
                      idx === 2 ? 'from-blue-100 to-blue-200' :
                      'from-red-100 to-red-200'
                    } flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`w-7 h-7 ${stat.color}`} />
                    </div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 border border-purple-200 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">{language === 'ar' ? 'المزايا الأساسية' : 'Core Features'}</span>
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              {language === 'ar' ? 'كل ما تحتاجه في مكان واحد' : 'Everything You Need in One Platform'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'ست أدوات قوية مدعومة بالذكاء الاصطناعي لتحويل ممارستك الطبية'
                : 'Six powerful AI-driven tools to transform your medical practice'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card 
                key={idx} 
                className="group hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-200 cursor-pointer overflow-hidden"
              >
                <CardContent className="p-8 space-y-4">
                  <div className={`w-16 h-16 rounded-2xl ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                    <span className="text-sm">{language === 'ar' ? 'اعرف المزيد' : 'Learn more'}</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">{language === 'ar' ? 'الفوائد' : 'Benefits'}</span>
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                  {language === 'ar' ? 'لماذا تختار MediTriage AI؟' : 'Why Choose MediTriage AI?'}
                </h2>
                <p className="text-xl text-gray-600">
                  {language === 'ar'
                    ? 'انضم إلى مئات الأطباء الذين يحولون ممارساتهم الطبية'
                    : 'Join hundreds of physicians transforming their medical practice'}
                </p>
              </div>

              <div className="space-y-6">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-gray-900">{benefit.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 shadow-xl"
                onClick={() => setLocation("/clinician/login")}
              >
                {language === 'ar' ? 'ابدأ تجربتك المجانية' : 'Start Your Free Trial'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Testimonials */}
            <div className="space-y-6">
              {testimonials.map((testimonial, idx) => (
                <Card key={idx} className="bg-white border-2 border-gray-100 hover:shadow-xl transition-all">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 italic leading-relaxed">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">
            {language === 'ar' ? 'جاهز للبدء؟' : 'Ready to Transform Your Practice?'}
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            {language === 'ar'
              ? 'انضم إلى آلاف الأطباء الذين يستخدمون MediTriage AI Pro لتحسين رعاية المرضى'
              : 'Join thousands of physicians using MediTriage AI Pro to improve patient care'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 shadow-xl"
              onClick={() => setLocation("/clinician/login")}
            >
              {language === 'ar' ? 'بوابة الأطباء' : 'Clinician Portal'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => setLocation("/patient/symptom-checker")}
            >
              {language === 'ar' ? 'بوابة المرضى' : 'Patient Portal'}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">MediTriage AI</h3>
                  <p className="text-xs text-gray-400">{language === 'ar' ? 'نظام التشغيل الطبي' : 'Medical OS'}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                {language === 'ar'
                  ? 'نظام تشخيص طبي شامل مدعوم بالذكاء الاصطناعي'
                  : 'AI-powered comprehensive medical diagnosis system'}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">{language === 'ar' ? 'المنتج' : 'Product'}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">{language === 'ar' ? 'المزايا' : 'Features'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الأسعار' : 'Pricing'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الأمان' : 'Security'}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">{language === 'ar' ? 'الشركة' : 'Company'}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'من نحن' : 'About Us'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'اتصل بنا' : 'Contact'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'المدونة' : 'Blog'}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">{language === 'ar' ? 'قانوني' : 'Legal'}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الخصوصية' : 'Privacy'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الشروط' : 'Terms'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الترخيص' : 'License'}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 MediTriage AI Pro. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
