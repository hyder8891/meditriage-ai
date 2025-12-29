import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Brain,
  Heart,
  Stethoscope,
  Users,
  MessageSquare,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  Microscope,
  Zap,
  Clock,
  Award,
  TrendingUp,
  Search,
  UserPlus,
  FileText,
  Lock,
  Database,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserCircle, LogOut } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor'>('patient');
  const { user, isAuthenticated, logout } = useAuth();
  
  // Animated counter state
  const [counters, setCounters] = useState({
    symptoms: 0,
    accuracy: 0,
    response: 0,
    conditions: 0,
  });

  // Animate counters on mount
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    const targets = {
      symptoms: 50000,
      accuracy: 99.2,
      response: 3,
      conditions: 1200,
    };

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setCounters({
        symptoms: Math.floor(targets.symptoms * progress),
        accuracy: parseFloat((targets.accuracy * progress).toFixed(1)),
        response: parseFloat((targets.response * progress).toFixed(1)),
        conditions: Math.floor(targets.conditions * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounters(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo.png" 
                  alt="My Doctor طبيبي" 
                  className="h-12 w-auto" 
                  style={{ imageRendering: '-webkit-optimize-contrast', objectFit: 'contain', width: '79px', height: '58px' }}
                />
              </div>
              <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">{language === 'ar' ? 'المميزات' : 'Features'}</a>
                <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 transition-colors">{language === 'ar' ? 'كيف يعمل' : 'How It Works'}</a>
                <a href="#ai-capabilities" className="text-slate-600 hover:text-blue-600 transition-colors">{language === 'ar' ? 'الذكاء الاصطناعي' : 'AI Capabilities'}</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                    <UserCircle className="w-5 h-5 text-slate-600" />
                    <div className="text-sm">
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">ID: {user.id}</div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      logout();
                      setLocation("/");
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => setLocation(user.role === 'clinician' ? "/clinician/dashboard" : "/patient/portal")} className="gradient-primary text-white">
                    {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setLocation("/patient-login")}>
                    {language === 'ar' ? 'دخول المريض' : 'Patient Login'}
                  </Button>
                  <Button variant="ghost" onClick={() => setLocation("/clinician/login")}>
                    {language === 'ar' ? 'دخول الطبيب' : 'Doctor Login'}
                  </Button>
                  <Button onClick={() => setLocation("/patient-login")} className="gradient-primary text-white">
                    {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Asymmetric 60/40 Layout */}
      <section className="relative py-24 lg:py-32 gradient-hero overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="container relative">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* Left: Hero Content (60%) */}
            <div className="lg:col-span-3 space-y-8 animate-fade-in">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-accent">
                <Sparkles className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'منصة الرعاية الصحية الذكية' : 'Smart Healthcare Platform'}
              </Badge>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-slate-900">
                  {language === 'ar' ? 'رعاية صحية متكاملة' : 'Complete Healthcare'}
                </span>
                <br />
                <span className="text-gradient">
                  {language === 'ar' ? 'بالذكاء الاصطناعي' : 'Powered by AI'}
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                {language === 'ar'
                  ? 'احصل على تقييم فوري بالذكاء الاصطناعي، ثم تواصل مع أطباء مختصين معتمدين للحصول على استشارة شاملة وخطة علاجية مخصصة.'
                  : 'Get instant AI-powered health assessment, then connect with certified specialist doctors for comprehensive consultation and personalized treatment plans.'}
              </p>

              {/* Dual CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => {
                    if (isAuthenticated) {
                      setLocation("/patient/symptom-checker");
                    } else {
                      setLocation("/patient-login");
                    }
                  }}
                  className="gradient-primary text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <Activity className="w-5 h-5 mr-2" />
                  {language === 'ar' ? 'ابدأ التقييم المجاني' : 'Start Free Assessment'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("#how-it-works")}
                  className="border-2 border-slate-300 bg-white px-8 py-6 text-lg hover:bg-slate-50 transition-all"
                >
                  {language === 'ar' ? 'اعرف المزيد' : 'Learn More'}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="font-medium">{language === 'ar' ? 'معتمد طبياً' : 'Medically Certified'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{language === 'ar' ? 'HIPAA متوافق' : 'HIPAA Compliant'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">{language === 'ar' ? 'تقييم 4.9/5' : '4.9/5 Rating'}</span>
                </div>
              </div>
            </div>

            {/* Right: Middle Eastern Family Healthcare Image (40%) */}
            <div className="lg:col-span-2 relative animate-float">
              <div className="relative">
                {/* Main image with overlay stats */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="/images/homepage/arab-family-doctor.jpg" 
                    alt="Arab family healthcare consultation"
                    className="w-full h-auto object-cover"
                  />
                  
                  {/* Floating stats overlay */}
                  <div className="absolute bottom-6 left-6 right-6 space-y-3">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl hover-lift">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-600">{language === 'ar' ? 'تحليل الذكاء الاصطناعي' : 'AI Analysis'}</div>
                          <div className="text-2xl font-bold text-slate-900">99.2%</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl hover-lift animation-delay-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-600">{language === 'ar' ? 'أطباء معتمدون' : 'Certified Doctors'}</div>
                          <div className="text-2xl font-bold text-slate-900">500+</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Numbered Cards */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200 font-accent">
              <Zap className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'كيف يعمل' : 'How It Works'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'ar' ? 'ثلاث خطوات بسيطة' : 'Three Simple Steps'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'من التقييم الأولي إلى الاستشارة الطبية الشاملة'
                : 'From initial assessment to comprehensive medical consultation'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: '01',
                icon: Brain,
                title: language === 'ar' ? 'تقييم ذكي فوري' : 'Instant AI Assessment',
                desc: language === 'ar' 
                  ? 'احصل على تحليل فوري لأعراضك باستخدام الذكاء الاصطناعي المتقدم مع تقييم شامل للحالة'
                  : 'Get instant analysis of your symptoms using advanced AI with comprehensive health assessment',
                gradient: 'from-blue-500 to-blue-600',
              },
              {
                number: '02',
                icon: Search,
                title: language === 'ar' ? 'اتصل بطبيب مختص' : 'Connect with Specialist',
                desc: language === 'ar'
                  ? 'اختر من بين مئات الأطباء المعتمدين حسب التخصص والتقييم والتوفر'
                  : 'Choose from hundreds of certified doctors by specialty, rating, and availability',
                gradient: 'from-purple-500 to-purple-600',
              },
              {
                number: '03',
                icon: FileText,
                title: language === 'ar' ? 'خطة علاجية مخصصة' : 'Personalized Treatment',
                desc: language === 'ar'
                  ? 'احصل على استشارة شاملة وخطة علاجية مصممة خصيصاً لحالتك مع متابعة مستمرة'
                  : 'Get comprehensive consultation and treatment plan tailored to your condition with continuous follow-up',
                gradient: 'from-cyan-500 to-cyan-600',
              },
            ].map((item, idx) => (
              <Card key={idx} className="relative border-none shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 bg-white">
                <CardContent className="p-8">
                  {/* Large number badge */}
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold font-accent text-slate-400">{item.number}</span>
                  </div>
                  
                  {/* Icon with gradient */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Capabilities - Deep Blue Gradient Section */}
      <section id="ai-capabilities" className="py-20 gradient-blue-deep text-white relative overflow-hidden">
        {/* Diagonal split decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 to-transparent"></div>
        
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Feature List */}
            <div className="space-y-8">
              <div>
                <Badge className="mb-4 bg-white/20 text-white border-white/30 font-accent">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'قدرات الذكاء الاصطناعي' : 'AI Capabilities'}
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  {language === 'ar' ? 'تقنية طبية متقدمة' : 'Advanced Medical Technology'}
                </h2>
                <p className="text-xl text-blue-100">
                  {language === 'ar'
                    ? 'مدعومة بملايين الحالات الطبية وأحدث خوارزميات التعلم الآلي'
                    : 'Powered by millions of medical cases and latest machine learning algorithms'}
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: Brain,
                    title: language === 'ar' ? 'تحليل الأعراض الذكي' : 'Smart Symptom Analysis',
                    desc: language === 'ar' ? 'تحليل متقدم للأعراض مع تقييم الخطورة' : 'Advanced symptom analysis with severity assessment',
                  },
                  {
                    icon: Microscope,
                    title: language === 'ar' ? 'تفسير الصور الطبية' : 'Medical Imaging Interpretation',
                    desc: language === 'ar' ? 'تحليل الأشعة والصور الطبية بدقة عالية' : 'X-ray and medical image analysis with high accuracy',
                  },
                  {
                    icon: FileText,
                    title: language === 'ar' ? 'التوثيق الطبي الآلي' : 'Automated Medical Documentation',
                    desc: language === 'ar' ? 'تحويل المحادثات إلى سجلات طبية منظمة' : 'Convert conversations to structured medical records',
                  },
                  {
                    icon: Database,
                    title: language === 'ar' ? 'قاعدة معرفة طبية شاملة' : 'Comprehensive Medical Knowledge',
                    desc: language === 'ar' ? 'الوصول إلى أحدث الأبحاث والإرشادات الطبية' : 'Access to latest research and medical guidelines',
                  },
                ].map((feature, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{feature.title}</h4>
                      <p className="text-blue-100 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Dashboard Mockup */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="bg-white rounded-xl p-6 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b">
                      <h3 className="font-bold text-slate-900">{language === 'ar' ? 'تحليل الحالة' : 'Case Analysis'}</h3>
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {language === 'ar' ? 'مكتمل' : 'Complete'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 animate-progress" style={{width: '95%'}}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-600">95%</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <div className="flex-1">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 animate-progress animation-delay-200" style={{width: '88%'}}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-600">88%</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                        <div className="flex-1">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 animate-progress animation-delay-1000" style={{width: '92%'}}></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-600">92%</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">12</div>
                          <div className="text-xs text-slate-600">{language === 'ar' ? 'أعراض' : 'Symptoms'}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">3</div>
                          <div className="text-xs text-slate-600">{language === 'ar' ? 'تشخيصات' : 'Diagnoses'}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-cyan-600">5</div>
                          <div className="text-xs text-slate-600">{language === 'ar' ? 'توصيات' : 'Recommendations'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section - 4 Columns with Animated Counters */}
      <section className="py-20 bg-slate-50">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Activity,
                value: counters.symptoms.toLocaleString(),
                label: language === 'ar' ? 'أعراض تم تحليلها' : 'Symptoms Analyzed',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: Award,
                value: `${counters.accuracy}%`,
                label: language === 'ar' ? 'معدل الدقة' : 'Accuracy Rate',
                color: 'from-purple-500 to-purple-600',
              },
              {
                icon: Clock,
                value: `<${counters.response}s`,
                label: language === 'ar' ? 'وقت الاستجابة' : 'Response Time',
                color: 'from-cyan-500 to-cyan-600',
              },
              {
                icon: Database,
                value: `${counters.conditions.toLocaleString()}+`,
                label: language === 'ar' ? 'حالات مغطاة' : 'Conditions Covered',
                color: 'from-green-500 to-green-600',
              },
            ].map((stat, idx) => (
              <Card key={idx} className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-white">
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-slate-900 mb-2 font-accent">{stat.value}</div>
                  <div className="text-sm font-medium text-slate-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators Grid */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200 font-accent">
              <Shield className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'الأمان والثقة' : 'Security & Trust'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'ar' ? 'معايير عالمية للأمان' : 'World-Class Security Standards'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'نلتزم بأعلى معايير الأمان والخصوصية لحماية بياناتك الصحية'
                : 'We adhere to the highest security and privacy standards to protect your health data'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: language === 'ar' ? 'HIPAA متوافق' : 'HIPAA Compliant',
                desc: language === 'ar' ? 'نلتزم بمعايير HIPAA لحماية المعلومات الصحية' : 'Compliant with HIPAA standards for health information protection',
                color: 'from-green-500 to-green-600',
              },
              {
                icon: Award,
                title: language === 'ar' ? 'دقة طبية عالية' : 'High Medical Accuracy',
                desc: language === 'ar' ? 'معدل دقة 99.2% معتمد من خبراء طبيين' : '99.2% accuracy rate certified by medical experts',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: Lock,
                title: language === 'ar' ? 'تشفير البيانات' : 'Data Encryption',
                desc: language === 'ar' ? 'تشفير شامل للبيانات أثناء النقل والتخزين' : 'End-to-end encryption for data in transit and at rest',
                color: 'from-purple-500 to-purple-600',
              },
            ].map((item, idx) => (
              <Card key={idx} className="border-2 border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all bg-white">
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Gradient Background */}
      <section className="py-24 gradient-cta text-white relative overflow-hidden">
        {/* Particle effect background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-float"></div>
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-white/20 rounded-full animate-float animation-delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white/40 rounded-full animate-float animation-delay-2000"></div>
          <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-white/25 rounded-full animate-float animation-delay-4000"></div>
        </div>

        <div className="container relative text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {language === 'ar' ? 'ابدأ رحلتك الصحية اليوم' : 'Start Your Health Journey Today'}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'انضم إلى آلاف المستخدمين الذين يثقون في منصتنا للحصول على رعاية صحية ذكية وشاملة'
              : 'Join thousands of users who trust our platform for smart and comprehensive healthcare'}
          </p>
          <Button
            size="lg"
            onClick={() => {
              if (isAuthenticated) {
                setLocation("/patient/symptom-checker");
              } else {
                setLocation("/patient-login");
              }
            }}
            className="bg-white text-blue-600 hover:bg-blue-50 px-12 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-1"
          >
            <Activity className="w-5 h-5 mr-2" />
            {language === 'ar' ? 'ابدأ الآن مجاناً' : 'Get Started Free'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Technology Showcase Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200 font-accent">
              <Sparkles className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'التكنولوجيا المتقدمة' : 'Advanced Technology'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'ar' ? 'مدعوم بأحدث التقنيات' : 'Powered by Cutting-Edge Technology'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'نستخدم أحدث تقنيات الذكاء الاصطناعي والبنية التحتية السحابية لتقديم رعاية صحية موثوقة وآمنة'
                : 'We leverage the latest AI technologies and cloud infrastructure to deliver reliable and secure healthcare'}
            </p>
          </div>

          {/* Technology Stack with Images */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left: Arab Family Using Technology */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="/images/homepage/arab-family-tablet.jpg" 
                  alt="Arab family using healthcare technology"
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-600">{language === 'ar' ? 'سهل الاستخدام' : 'Easy to Use'}</div>
                    <div className="text-xl font-bold text-slate-900">{language === 'ar' ? 'لجميع الأعمار' : 'For All Ages'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Technology Features */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {language === 'ar' ? 'ذكاء اصطناعي متقدم' : 'Advanced AI Models'}
                  </h3>
                  <p className="text-slate-600">
                    {language === 'ar'
                      ? 'نستخدم نماذج الذكاء الاصطناعي الطبية المتقدمة من Google Gemini وDeepSeek للتحليل الدقيق'
                      : 'Utilizing advanced medical AI models from Google Gemini and DeepSeek for accurate analysis'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {language === 'ar' ? 'بنية تحتية قوية' : 'Robust Infrastructure'}
                  </h3>
                  <p className="text-slate-600">
                    {language === 'ar'
                      ? 'مبني على React وNode.js مع قاعدة بيانات آمنة وموثوقة لضمان أفضل أداء'
                      : 'Built on React and Node.js with secure and reliable database for optimal performance'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {language === 'ar' ? 'أمان من الدرجة الأولى' : 'Enterprise-Grade Security'}
                  </h3>
                  <p className="text-slate-600">
                    {language === 'ar'
                      ? 'تشفير شامل وامتثال كامل لمعايير HIPAA لحماية بياناتك الصحية'
                      : 'End-to-end encryption and full HIPAA compliance to protect your health data'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Partners Logos */}
          <div className="bg-white rounded-3xl p-12 shadow-xl">
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">
              {language === 'ar' ? 'مدعوم بأفضل التقنيات' : 'Powered by Industry-Leading Technologies'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              <div className="flex items-center justify-center p-4">
                <img 
                  src="/images/homepage/tech-logos.jpg" 
                  alt="Technology stack logos"
                  className="w-full h-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex items-center justify-center p-4">
                <img 
                  src="/images/homepage/health-stack.jpeg" 
                  alt="Healthcare technology stack"
                  className="w-full h-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex items-center justify-center p-4">
                <img 
                  src="/images/homepage/ai-healthcare.webp" 
                  alt="AI healthcare technology"
                  className="w-full h-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="flex items-center justify-center p-4">
                <img 
                  src="/images/homepage/arab-family-tech.jpg" 
                  alt="Arab family healthcare technology"
                  className="w-full h-auto object-contain opacity-70 hover:opacity-100 transition-opacity rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-white">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img 
                src="/logo.png" 
                alt="My Doctor طبيبي" 
                className="h-12 w-auto mb-4 brightness-0 invert" 
              />
              <p className="text-slate-400 text-sm">
                {language === 'ar' ? 'رعاية صحية ذكية بالذكاء الاصطناعي' : 'Smart healthcare powered by AI'}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{language === 'ar' ? 'المنتج' : 'Product'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">{language === 'ar' ? 'المميزات' : 'Features'}</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">{language === 'ar' ? 'كيف يعمل' : 'How It Works'}</a></li>
                <li><a href="#ai-capabilities" className="hover:text-white transition-colors">{language === 'ar' ? 'الذكاء الاصطناعي' : 'AI Capabilities'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{language === 'ar' ? 'الشركة' : 'Company'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'عن المنصة' : 'About Us'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'اتصل بنا' : 'Contact'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الوظائف' : 'Careers'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{language === 'ar' ? 'قانوني' : 'Legal'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الخصوصية' : 'Privacy'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الشروط' : 'Terms'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الأمان' : 'Security'}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-400">
            <p>&copy; 2024 My Doctor. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
