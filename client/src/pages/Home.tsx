import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Brain,
  Heart,
  Stethoscope,
  MessageSquare,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  Clock,
  MapPin,
  FileText,
  Lock,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
  Globe,
  HeartPulse,
  Scan,
  ClipboardList,
  Building2,
  Menu,
  X,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle, LogOut } from "lucide-react";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/useScrollAnimation";

// Intersection Observer hook for scroll animations
function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px', ...options }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, []);

  return { ref, isInView };
}

// Animated counter component - Fixed to properly detect viewport intersection
function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }: { 
  end: number; 
  duration?: number; 
  suffix?: string; 
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const hasAnimated = useRef(false);

  // Separate IntersectionObserver for the counter
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsInView(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px 0px 50px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Animation effect
  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const steps = 60;
    const increment = end / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(increment * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return (
    <div ref={containerRef} className="inline-block">
      <span>{prefix}{count.toLocaleString()}{suffix}</span>
    </div>
  );
}

// Floating Action Button Component
function FloatingActionButton({ isRTL, onClick }: { isRTL: boolean; onClick: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className={`fab fab-primary gpu-accelerated ${isVisible ? 'animate-scale-up visible' : ''}`}
      aria-label={isRTL ? 'ابدأ التقييم' : 'Start Assessment'}
    >
      <Activity className="w-6 h-6" />
    </button>
  );
}

// Mobile Menu Component
function MobileMenu({ 
  isOpen, 
  onClose, 
  isRTL, 
  isAuthenticated, 
  onNavigate 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  isRTL: boolean;
  isAuthenticated: boolean;
  onNavigate: (path: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} w-80 h-full bg-white shadow-xl transform transition-transform duration-300`}>
        <div className="p-4 border-b flex justify-between items-center">
          <img src="/logo.png" alt="MediTriage AI" className="h-10" />
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg touch-target">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { href: '#features', labelAr: 'المميزات', labelEn: 'Features' },
            { href: '#how-it-works', labelAr: 'كيف يعمل', labelEn: 'How It Works' },
            { href: '#testimonials', labelAr: 'آراء المستخدمين', labelEn: 'Testimonials' },
            { href: '#faq', labelAr: 'الأسئلة الشائعة', labelEn: 'FAQ' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block py-3 px-4 text-lg font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors touch-target"
            >
              {isRTL ? item.labelAr : item.labelEn}
            </a>
          ))}
          <div className="pt-4 border-t mt-4">
            <Button
              onClick={() => {
                onNavigate(isAuthenticated ? '/patient/portal' : '/patient-login');
                onClose();
              }}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-6 text-lg"
            >
              {isRTL ? (isAuthenticated ? 'لوحة التحكم' : 'ابدأ الآن') : (isAuthenticated ? 'Dashboard' : 'Get Started')}
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const isRTL = language === 'ar';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for navbar effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll animation refs
  const heroRef = useInView();
  const featuresRef = useInView();
  const howItWorksRef = useInView();
  const benefitsRef = useInView();
  const testimonialsRef = useInView();
  const faqRef = useInView();

  const features = [
    {
      icon: Brain,
      titleAr: 'فحص الأعراض بالذكاء الاصطناعي',
      titleEn: 'AI Symptom Checker',
      descAr: 'تحليل ذكي لأعراضك مع توصيات طبية فورية مبنية على أحدث الأبحاث الطبية',
      descEn: 'Smart analysis of your symptoms with instant medical recommendations based on latest research',
      image: '/images/homepage/symptom-checker-phone.jpg',
      link: '/patient/symptom-checker',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: HeartPulse,
      titleAr: 'قياس النبض بالكاميرا',
      titleEn: 'Bio-Scanner Vitals',
      descAr: 'قياس معدل ضربات القلب باستخدام كاميرا هاتفك فقط - تقنية rPPG المتقدمة',
      descEn: 'Measure your heart rate using just your phone camera - advanced rPPG technology',
      image: '/images/homepage/heart-scanner-feature.jpg',
      link: '/patient/bio-scanner',
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: FileText,
      titleAr: 'تحليل التقارير الطبية',
      titleEn: 'Medical Report Analysis',
      descAr: 'رفع تقاريرك الطبية والحصول على تفسير مبسط وواضح بلغتك',
      descEn: 'Upload your medical reports and get simplified explanations in your language',
      image: '/images/homepage/medical-report-analysis.jpg',
      link: '/patient/medical-reports',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: MapPin,
      titleAr: 'محدد المرافق الصحية',
      titleEn: 'Care Locator',
      descAr: 'اعثر على أقرب المستشفيات والصيدليات والعيادات في منطقتك',
      descEn: 'Find the nearest hospitals, pharmacies, and clinics in your area',
      image: '/images/homepage/care-locator-map.jpg',
      link: '/patient/care-locator',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: MessageSquare,
      titleAr: 'مساعد صحي ذكي',
      titleEn: 'AI Health Assistant',
      descAr: 'تحدث مع مساعدنا الذكي للحصول على إجابات فورية لأسئلتك الصحية',
      descEn: 'Chat with our AI assistant for instant answers to your health questions',
      image: '/images/homepage/ai-chat-icon.jpg',
      link: '/patient/ai-chat',
      color: 'from-teal-500 to-cyan-500',
    },
    {
      icon: ClipboardList,
      titleAr: 'سجلك الصحي الشامل',
      titleEn: 'Health Records',
      descAr: 'احتفظ بجميع سجلاتك الصحية في مكان واحد آمن ومنظم',
      descEn: 'Keep all your health records in one secure and organized place',
      image: '/images/homepage/health-records-icon.jpg',
      link: '/patient/health-records',
      color: 'from-orange-500 to-amber-500',
    },
  ];

  const benefits = [
    {
      iconAr: '🏠',
      titleAr: 'من راحة منزلك',
      titleEn: 'From Home Comfort',
      descAr: 'احصل على استشارة صحية دون الحاجة للخروج',
      descEn: 'Get health consultation without leaving home',
    },
    {
      iconAr: '⚡',
      titleAr: 'نتائج فورية',
      titleEn: 'Instant Results',
      descAr: 'تحليل ذكي في ثوانٍ معدودة',
      descEn: 'Smart analysis in seconds',
    },
    {
      iconAr: '🔒',
      titleAr: 'خصوصية تامة',
      titleEn: 'Complete Privacy',
      descAr: 'بياناتك محمية بأعلى معايير الأمان',
      descEn: 'Your data protected with highest security standards',
    },
    {
      iconAr: '🌐',
      titleAr: 'دعم ثنائي اللغة',
      titleEn: 'Bilingual Support',
      descAr: 'واجهة كاملة بالعربية والإنجليزية',
      descEn: 'Full interface in Arabic and English',
    },
  ];

  const testimonials = [
    {
      nameAr: 'أحمد محمد',
      nameEn: 'Ahmed Mohammed',
      roleAr: 'أب لثلاثة أطفال',
      roleEn: 'Father of three',
      textAr: 'تطبيق رائع! ساعدني في فهم أعراض طفلي قبل زيارة الطبيب. الواجهة العربية ممتازة.',
      textEn: 'Amazing app! Helped me understand my child\'s symptoms before visiting the doctor. The Arabic interface is excellent.',
      rating: 5,
    },
    {
      nameAr: 'فاطمة علي',
      nameEn: 'Fatima Ali',
      roleAr: 'معلمة',
      roleEn: 'Teacher',
      textAr: 'ميزة قياس النبض بالكاميرا مذهلة! أستخدمها يومياً لمتابعة صحتي.',
      textEn: 'The camera heart rate feature is amazing! I use it daily to monitor my health.',
      rating: 5,
    },
    {
      nameAr: 'محمد حسين',
      nameEn: 'Mohammed Hussein',
      roleAr: 'متقاعد',
      roleEn: 'Retired',
      textAr: 'أخيراً تطبيق صحي يفهم احتياجاتنا. تحليل التقارير الطبية وفر علي الكثير من الوقت.',
      textEn: 'Finally a health app that understands our needs. Medical report analysis saved me a lot of time.',
      rating: 5,
    },
  ];

  const howItWorksSteps = [
    {
      step: 1,
      iconAr: '📝',
      titleAr: 'أدخل أعراضك',
      titleEn: 'Enter Your Symptoms',
      descAr: 'صف أعراضك بكلماتك الخاصة أو اختر من القائمة',
      descEn: 'Describe your symptoms in your own words or select from the list',
      image: '/images/homepage/symptom-checker-phone.jpg',
    },
    {
      step: 2,
      iconAr: '🤖',
      titleAr: 'تحليل ذكي',
      titleEn: 'AI Analysis',
      descAr: 'يقوم الذكاء الاصطناعي بتحليل أعراضك ومقارنتها بقاعدة بيانات طبية ضخمة',
      descEn: 'AI analyzes your symptoms and compares them with a massive medical database',
      image: '/images/homepage/ai-health-analysis.jpg',
    },
    {
      step: 3,
      iconAr: '✅',
      titleAr: 'احصل على النتائج',
      titleEn: 'Get Results',
      descAr: 'احصل على تقييم شامل مع توصيات واضحة للخطوات التالية',
      descEn: 'Get a comprehensive assessment with clear recommendations for next steps',
      image: '/images/homepage/health-dashboard.jpg',
    },
  ];

  return (
    <div className={`min-h-screen bg-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation - Enhanced for mobile */}
      <nav className={`border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="MediTriage AI" 
                className="h-10 sm:h-12 w-auto cursor-pointer" 
                onClick={() => setLocation('/')}
                loading="eager"
              />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <a href="#features" className="text-slate-600 hover:text-teal-600 transition-colors">
                {isRTL ? 'المميزات' : 'Features'}
              </a>
              <a href="#how-it-works" className="text-slate-600 hover:text-teal-600 transition-colors">
                {isRTL ? 'كيف يعمل' : 'How It Works'}
              </a>
              <a href="#testimonials" className="text-slate-600 hover:text-teal-600 transition-colors">
                {isRTL ? 'آراء المستخدمين' : 'Testimonials'}
              </a>
              <a href="#faq" className="text-slate-600 hover:text-teal-600 transition-colors">
                {isRTL ? 'الأسئلة الشائعة' : 'FAQ'}
              </a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher />
              
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg touch-target"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center gap-2">
                {isAuthenticated && user ? (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setLocation('/patient/portal')}
                      className="text-teal-600"
                    >
                      <UserCircle className="w-5 h-5 mr-1" />
                      {user.name?.split(' ')[0]}
                    </Button>
                    <Button 
                      onClick={() => setLocation('/patient/portal')} 
                      className="bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700"
                    >
                      {isRTL ? 'لوحة التحكم' : 'Dashboard'}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setLocation('/patient-login')} 
                    className="bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 animate-pulse-soft"
                  >
                    {isRTL ? 'ابدأ الآن' : 'Get Started'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        isRTL={isRTL}
        isAuthenticated={isAuthenticated}
        onNavigate={setLocation}
      />

      {/* Hero Section - Enhanced with animations */}
      <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden bg-gradient-to-br from-teal-50 via-white to-blue-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d9488' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="container relative">
          <div 
            ref={heroRef.ref}
            className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center transition-all duration-700 ${heroRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            {/* Hero Content */}
            <div className={`space-y-6 sm:space-y-8 ${isRTL ? 'lg:order-2' : ''}`}>
              <Badge className="bg-teal-100 text-teal-700 border-teal-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm animate-bounce-soft">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {isRTL ? 'منصة الرعاية الصحية الذكية #1 في العراق' : '#1 Smart Healthcare Platform in Iraq'}
              </Badge>
              
              <h1 className="text-responsive-hero font-bold leading-tight">
                <span className="text-slate-900 block">
                  {isRTL ? 'صحتك بين يديك' : 'Your Health'}
                </span>
                <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent block animate-fade-in">
                  {isRTL ? 'بذكاء اصطناعي متقدم' : 'In Your Hands'}
                </span>
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-xl">
                {isRTL
                  ? 'احصل على تقييم صحي فوري، قياس نبضات القلب، تحليل التقارير الطبية، والمزيد - كل ذلك من هاتفك المحمول وبلغتك العربية.'
                  : 'Get instant health assessment, heart rate measurement, medical report analysis, and more - all from your mobile phone in your language.'}
              </p>

              {/* CTA Buttons - Mobile optimized */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  size="lg"
                  onClick={() => setLocation(isAuthenticated ? '/patient/portal' : '/patient-login')}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 w-full sm:w-auto touch-target glow-teal"
                >
                  <Activity className="w-5 h-5 mr-2 animate-heartbeat" />
                  {isRTL ? 'ابدأ التقييم المجاني' : 'Start Free Assessment'}
                  <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-teal-200 bg-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg hover:bg-teal-50 transition-all w-full sm:w-auto touch-target"
                >
                  {isRTL ? 'اكتشف المميزات' : 'Explore Features'}
                  <ChevronDown className="w-5 h-5 ml-2 animate-bounce-soft" />
                </Button>
              </div>

              {/* Trust Indicators - Mobile responsive */}
              <div className="flex flex-wrap gap-4 sm:gap-6 pt-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span className="font-medium">{isRTL ? 'معتمد طبياً' : 'Medically Certified'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span className="font-medium">{isRTL ? 'خصوصية مضمونة' : 'Privacy Guaranteed'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{isRTL ? 'تقييم 4.9/5' : '4.9/5 Rating'}</span>
                </div>
              </div>
            </div>

            {/* Hero Image - Optimized for mobile */}
            <div className={`relative ${isRTL ? 'lg:order-1' : ''}`}>
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl gpu-accelerated">
                <img 
                  src="/images/homepage/hero-family-health.jpg" 
                  alt={isRTL ? 'عائلة عربية تستخدم تطبيق الصحة' : 'Arab family using health app'}
                  className="w-full h-auto object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
                
                {/* Floating Stats Cards - Responsive positioning */}
                <div className={`absolute top-3 sm:top-6 ${isRTL ? 'right-3 sm:right-6' : 'left-3 sm:left-6'} bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg animate-float-slow`}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                      <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-slate-500">{isRTL ? 'تحليل الذكاء الاصطناعي' : 'AI Analysis'}</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900">
                        <AnimatedCounter end={99} suffix="%" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`absolute bottom-3 sm:bottom-6 ${isRTL ? 'left-3 sm:left-6' : 'right-3 sm:right-6'} bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg animate-float-slow animation-delay-1000`}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm text-slate-500">{isRTL ? 'مستخدم نشط' : 'Active Users'}</div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-900">
                        +<AnimatedCounter end={50} suffix="K" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced with animated counters */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center text-white">
            <div className="p-3 sm:p-4">
              <div className="text-2xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">
                +<AnimatedCounter end={50} suffix="K" />
              </div>
              <div className="text-teal-100 text-xs sm:text-base">{isRTL ? 'مستخدم نشط' : 'Active Users'}</div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-2xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">
                +<AnimatedCounter end={150} suffix="K" />
              </div>
              <div className="text-teal-100 text-xs sm:text-base">{isRTL ? 'تقييم صحي' : 'Health Assessments'}</div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-2xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">
                <AnimatedCounter end={99} suffix="%" />
              </div>
              <div className="text-teal-100 text-xs sm:text-base">{isRTL ? 'دقة التحليل' : 'Analysis Accuracy'}</div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-2xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">24/7</div>
              <div className="text-teal-100 text-xs sm:text-base">{isRTL ? 'متاح دائماً' : 'Always Available'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced with staggered animations */}
      <section id="features" className="py-12 sm:py-20 bg-slate-50 content-visibility-auto">
        <div className="container">
          <div 
            ref={featuresRef.ref}
            className={`text-center mb-10 sm:mb-16 transition-all duration-700 ${featuresRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <Badge className="bg-teal-100 text-teal-700 border-teal-200 mb-4">
              {isRTL ? 'مميزاتنا' : 'Our Features'}
            </Badge>
            <h2 className="text-responsive-2xl font-bold text-slate-900 mb-4">
              {isRTL ? 'كل ما تحتاجه لصحة أفضل' : 'Everything You Need for Better Health'}
            </h2>
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto">
              {isRTL 
                ? 'مجموعة شاملة من الأدوات الصحية الذكية المصممة خصيصاً لك ولعائلتك'
                : 'A comprehensive suite of smart health tools designed specifically for you and your family'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer gpu-accelerated ${featuresRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => setLocation(isAuthenticated ? feature.link : '/patient-login')}
              >
                <div className="h-40 sm:h-48 overflow-hidden relative">
                  <img 
                    src={feature.image} 
                    alt={isRTL ? feature.titleAr : feature.titleEn}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                </div>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {isRTL ? feature.titleAr : feature.titleEn}
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 mb-4">
                    {isRTL ? feature.descAr : feature.descEn}
                  </p>
                  <div className="flex items-center text-teal-600 font-medium group-hover:gap-2 transition-all">
                    <span>{isRTL ? 'جرب الآن' : 'Try Now'}</span>
                    <ChevronRight className={`w-4 h-4 transform group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 sm:py-20 bg-white content-visibility-auto">
        <div className="container">
          <div 
            ref={howItWorksRef.ref}
            className={`text-center mb-10 sm:mb-16 transition-all duration-700 ${howItWorksRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-4">
              {isRTL ? 'كيف يعمل' : 'How It Works'}
            </Badge>
            <h2 className="text-responsive-2xl font-bold text-slate-900 mb-4">
              {isRTL ? 'ثلاث خطوات بسيطة' : 'Three Simple Steps'}
            </h2>
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto">
              {isRTL 
                ? 'ابدأ رحلتك الصحية في دقائق معدودة'
                : 'Start your health journey in just minutes'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {howItWorksSteps.map((item, index) => (
              <div 
                key={index} 
                className={`relative transition-all duration-700 ${howItWorksRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 gpu-accelerated">
                  <div className="h-40 sm:h-48 overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={isRTL ? item.titleAr : item.titleEn}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold mb-4 animate-pulse-soft">
                      {item.step}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                      {isRTL ? item.titleAr : item.titleEn}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600">
                      {isRTL ? item.descAr : item.descEn}
                    </p>
                  </div>
                </div>
                {index < 2 && (
                  <div className={`hidden md:block absolute top-1/2 ${isRTL ? '-left-4' : '-right-4'} transform -translate-y-1/2 z-10`}>
                    <ChevronRight className={`w-8 h-8 text-teal-400 animate-bounce-soft ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-teal-600 to-teal-700 text-white content-visibility-auto">
        <div className="container">
          <div 
            ref={benefitsRef.ref}
            className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center transition-all duration-700 ${benefitsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <div className={isRTL ? 'lg:order-2' : ''}>
              <Badge className="bg-white/20 text-white border-white/30 mb-4">
                {isRTL ? 'لماذا نحن؟' : 'Why Choose Us?'}
              </Badge>
              <h2 className="text-responsive-2xl font-bold mb-4 sm:mb-6">
                {isRTL ? 'صُمم خصيصاً للمجتمع العربي' : 'Designed for the Arab Community'}
              </h2>
              <p className="text-base sm:text-xl text-teal-100 mb-6 sm:mb-8">
                {isRTL 
                  ? 'نفهم احتياجاتك الصحية ونقدم لك تجربة مصممة بعناية لتناسب ثقافتك ولغتك'
                  : 'We understand your health needs and provide an experience carefully designed to fit your culture and language'}
              </p>
              
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-white/10 rounded-xl backdrop-blur-sm transition-all duration-500 hover:bg-white/20 ${benefitsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="text-2xl sm:text-3xl">{benefit.iconAr}</div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base mb-1">{isRTL ? benefit.titleAr : benefit.titleEn}</h4>
                      <p className="text-teal-100 text-xs sm:text-sm">{isRTL ? benefit.descAr : benefit.descEn}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={isRTL ? 'lg:order-1' : ''}>
              <img 
                src="/images/homepage/elderly-care.jpg" 
                alt={isRTL ? 'رعاية صحية للعائلة' : 'Family healthcare'}
                className="rounded-2xl shadow-2xl w-full"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-12 sm:py-20 bg-slate-50 content-visibility-auto">
        <div className="container">
          <div 
            ref={testimonialsRef.ref}
            className={`text-center mb-10 sm:mb-16 transition-all duration-700 ${testimonialsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 mb-4">
              {isRTL ? 'آراء المستخدمين' : 'User Reviews'}
            </Badge>
            <h2 className="text-responsive-2xl font-bold text-slate-900 mb-4">
              {isRTL ? 'ماذا يقول مستخدمونا' : 'What Our Users Say'}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-500 gpu-accelerated ${testimonialsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">
                    "{isRTL ? testimonial.textAr : testimonial.textEn}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold">
                      {(isRTL ? testimonial.nameAr : testimonial.nameEn).charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm sm:text-base text-slate-900">
                        {isRTL ? testimonial.nameAr : testimonial.nameEn}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500">
                        {isRTL ? testimonial.roleAr : testimonial.roleEn}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 sm:py-20 bg-white content-visibility-auto">
        <div className="container">
          <div 
            ref={faqRef.ref}
            className={`text-center mb-10 sm:mb-16 transition-all duration-700 ${faqRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <Badge className="bg-teal-100 text-teal-700 border-teal-200 mb-4">
              {isRTL ? 'الأسئلة الشائعة' : 'FAQ'}
            </Badge>
            <h2 className="text-responsive-2xl font-bold text-slate-900 mb-4">
              {isRTL ? 'أسئلة شائعة' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              {isRTL 
                ? 'إجابات على الأسئلة الأكثر شيوعاً حول الخصوصية والأمان وكيفية عمل التقييم بالذكاء الاصطناعي'
                : 'Answers to the most common questions about privacy, security, and how our AI assessment works'}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4">
              {/* Privacy Questions */}
              <AccordionItem value="privacy-1" className="border border-slate-200 rounded-lg sm:rounded-xl px-4 sm:px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm sm:text-lg font-semibold text-slate-900 hover:no-underline py-4 sm:py-5">
                  {isRTL ? 'كيف تحمون خصوصية بياناتي الصحية؟' : 'How do you protect my health data privacy?'}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 leading-relaxed pb-4 sm:pb-5">
                  {isRTL 
                    ? 'نحن ملتزمون بأعلى معايير الخصوصية. جميع بياناتك الصحية مشفرة باستخدام تشفير AES-256 أثناء النقل والتخزين. لا نشارك بياناتك مع أي طرف ثالث دون موافقتك الصريحة. يمكنك حذف بياناتك في أي وقت من إعدادات حسابك.'
                    : 'We are committed to the highest privacy standards. All your health data is encrypted using AES-256 encryption during transit and storage. We never share your data with third parties without your explicit consent. You can delete your data at any time from your account settings.'}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="privacy-2" className="border border-slate-200 rounded-lg sm:rounded-xl px-4 sm:px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm sm:text-lg font-semibold text-slate-900 hover:no-underline py-4 sm:py-5">
                  {isRTL ? 'هل تبيعون بياناتي لشركات التأمين أو الإعلانات؟' : 'Do you sell my data to insurance companies or advertisers?'}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 leading-relaxed pb-4 sm:pb-5">
                  {isRTL 
                    ? 'لا، نحن لا نبيع بياناتك أبداً. نموذج عملنا لا يعتمد على بيع البيانات. بياناتك الصحية ملك لك وحدك، ونستخدمها فقط لتقديم الخدمات الصحية التي طلبتها.'
                    : 'No, we never sell your data. Our business model does not rely on selling data. Your health data belongs to you alone, and we only use it to provide the health services you requested.'}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="security-1" className="border border-slate-200 rounded-lg sm:rounded-xl px-4 sm:px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm sm:text-lg font-semibold text-slate-900 hover:no-underline py-4 sm:py-5">
                  {isRTL ? 'ما هي إجراءات الأمان المستخدمة لحماية بياناتي؟' : 'What security measures are used to protect my data?'}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 leading-relaxed pb-4 sm:pb-5">
                  {isRTL 
                    ? 'نستخدم طبقات متعددة من الأمان تشمل: تشفير SSL/TLS لجميع الاتصالات، مصادقة ثنائية العوامل، جدران حماية متقدمة، مراقبة أمنية على مدار الساعة، ونسخ احتياطي مشفر. نحن متوافقون مع معايير HIPAA وGDPR.'
                    : 'We use multiple layers of security including: SSL/TLS encryption for all communications, two-factor authentication, advanced firewalls, 24/7 security monitoring, and encrypted backups. We are compliant with HIPAA and GDPR standards.'}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ai-1" className="border border-slate-200 rounded-lg sm:rounded-xl px-4 sm:px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm sm:text-lg font-semibold text-slate-900 hover:no-underline py-4 sm:py-5">
                  {isRTL ? 'كيف يعمل التقييم الصحي بالذكاء الاصطناعي؟' : 'How does the AI health assessment work?'}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 leading-relaxed pb-4 sm:pb-5">
                  {isRTL 
                    ? 'يستخدم نظامنا نماذج ذكاء اصطناعي متقدمة مدربة على ملايين الحالات الطبية الموثقة. عند إدخال أعراضك، يقوم النظام بتحليلها ومقارنتها مع قاعدة بيانات طبية شاملة لتقديم تقييم أولي وتوصيات مناسبة.'
                    : 'Our system uses advanced AI models trained on millions of documented medical cases. When you enter your symptoms, the system analyzes them and compares them with a comprehensive medical database to provide an initial assessment and appropriate recommendations.'}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ai-2" className="border border-slate-200 rounded-lg sm:rounded-xl px-4 sm:px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm sm:text-lg font-semibold text-slate-900 hover:no-underline py-4 sm:py-5">
                  {isRTL ? 'هل يمكن للذكاء الاصطناعي أن يحل محل الطبيب؟' : 'Can AI replace a doctor?'}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 leading-relaxed pb-4 sm:pb-5">
                  {isRTL 
                    ? 'لا، الذكاء الاصطناعي لا يحل محل الطبيب. نظامنا مصمم كأداة مساعدة لتقديم تقييم أولي وتوجيهك نحو الرعاية المناسبة. نوصي دائماً باستشارة طبيب مختص للتشخيص النهائي والعلاج.'
                    : 'No, AI does not replace a doctor. Our system is designed as a supportive tool to provide initial assessment and guide you toward appropriate care. We always recommend consulting a qualified physician for final diagnosis and treatment.'}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ai-3" className="border border-slate-200 rounded-lg sm:rounded-xl px-4 sm:px-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <AccordionTrigger className="text-sm sm:text-lg font-semibold text-slate-900 hover:no-underline py-4 sm:py-5">
                  {isRTL ? 'ما مدى دقة التقييم الصحي بالذكاء الاصطناعي؟' : 'How accurate is the AI health assessment?'}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 leading-relaxed pb-4 sm:pb-5">
                  {isRTL 
                    ? 'نظامنا يحقق دقة تزيد عن 95% في تحديد مستوى الخطورة الصحيحة. ومع ذلك، نؤكد أن هذا تقييم أولي ويجب التحقق منه من قبل متخصص طبي. نقوم بتحديث وتحسين نماذجنا باستمرار بناءً على أحدث الأبحاث الطبية.'
                    : 'Our system achieves over 95% accuracy in identifying the correct severity level. However, we emphasize that this is an initial assessment and should be verified by a medical professional. We continuously update and improve our models based on the latest medical research.'}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="container">
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-1/2 -right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-white rounded-full blur-3xl animate-blob"></div>
              <div className="absolute -bottom-1/2 -left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-white rounded-full blur-3xl animate-blob animation-delay-2000"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-responsive-2xl font-bold mb-4">
                {isRTL ? 'ابدأ رحلتك الصحية اليوم' : 'Start Your Health Journey Today'}
              </h2>
              <p className="text-base sm:text-xl text-teal-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
                {isRTL 
                  ? 'انضم إلى آلاف المستخدمين الذين يثقون بنا لإدارة صحتهم بذكاء'
                  : 'Join thousands of users who trust us to manage their health smartly'}
              </p>
              <Button
                size="lg"
                onClick={() => setLocation(isAuthenticated ? '/patient/portal' : '/patient-login')}
                className="bg-white text-teal-700 hover:bg-teal-50 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-lg touch-target animate-pulse-soft"
              >
                {isRTL ? 'سجل مجاناً الآن' : 'Sign Up Free Now'}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 sm:py-16">
        <div className="container">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            <div className="sm:col-span-2">
              <img 
                src="/logo.png" 
                alt="MediTriage AI" 
                className="h-10 sm:h-12 w-auto mb-4 brightness-0 invert"
                loading="lazy"
              />
              <p className="text-slate-400 mb-6 max-w-md text-sm sm:text-base">
                {isRTL 
                  ? 'منصة الرعاية الصحية الذكية الأولى في العراق. نستخدم أحدث تقنيات الذكاء الاصطناعي لتقديم تقييم صحي دقيق وموثوق.'
                  : 'The first smart healthcare platform in Iraq. We use the latest AI technologies to provide accurate and reliable health assessments.'}
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer touch-target">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer touch-target">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer touch-target">
                  <Phone className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-sm sm:text-base">{isRTL ? 'روابط سريعة' : 'Quick Links'}</h4>
              <ul className="space-y-2 text-slate-400 text-sm sm:text-base">
                <li><a href="#features" className="hover:text-white transition-colors">{isRTL ? 'المميزات' : 'Features'}</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">{isRTL ? 'كيف يعمل' : 'How It Works'}</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">{isRTL ? 'آراء المستخدمين' : 'Testimonials'}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-sm sm:text-base">{isRTL ? 'الدعم' : 'Support'}</h4>
              <ul className="space-y-2 text-slate-400 text-sm sm:text-base">
                <li><a href="#faq" className="hover:text-white transition-colors">{isRTL ? 'الأسئلة الشائعة' : 'FAQ'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{isRTL ? 'شروط الاستخدام' : 'Terms of Use'}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-slate-400 text-sm sm:text-base">
            <p>© 2026 MediTriage AI. {isRTL ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <FloatingActionButton 
        isRTL={isRTL} 
        onClick={() => setLocation(isAuthenticated ? '/patient/portal' : '/patient-login')} 
      />
    </div>
  );
}
