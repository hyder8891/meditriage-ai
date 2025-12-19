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
  Database,
  Cpu,
  Network,
  Layers,
  Target,
  MessageSquare,
  Lightbulb,
  Rocket,
  BarChart,
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useEffect, useState } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { strings, language } = useLanguage();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const aiCapabilities = [
    {
      icon: Brain,
      title: language === 'ar' ? 'محرك التفكير السريري' : 'Clinical Reasoning Engine',
      description: language === 'ar' ? 'نماذج لغوية كبيرة متقدمة (LLM) تحلل الأعراض وتولد تشخيصات تفاضلية بدقة 99.2٪' : 'Advanced Large Language Models (LLM) analyze symptoms and generate differential diagnoses with 99.2% accuracy',
      features: [
        language === 'ar' ? 'DeepSeek & Gemini AI' : 'DeepSeek & Gemini AI',
        language === 'ar' ? 'معالجة اللغة الطبيعية' : 'Natural Language Processing',
        language === 'ar' ? 'التعلم المستمر' : 'Continuous Learning',
      ],
      gradient: "from-purple-600 via-indigo-600 to-blue-600",
    },
    {
      icon: Database,
      title: language === 'ar' ? 'قاعدة بيانات طبية شاملة' : 'Extensive Medical Database',
      description: language === 'ar' ? 'أكثر من 10,000 حالة مرضية، 50,000 دواء، وملايين السجلات الطبية للتدريب' : 'Over 10,000 medical conditions, 50,000 medications, and millions of medical records for training',
      features: [
        language === 'ar' ? 'سياق عراقي محلي' : 'Iraqi Local Context',
        language === 'ar' ? 'تحديثات في الوقت الفعلي' : 'Real-time Updates',
        language === 'ar' ? 'أدلة قائمة على الأدلة' : 'Evidence-based Guidelines',
      ],
      gradient: "from-green-600 via-emerald-600 to-teal-600",
    },
    {
      icon: Microscope,
      title: language === 'ar' ? 'تحليل الصور الطبية بالذكاء الاصطناعي' : 'AI-Powered Medical Imaging',
      description: language === 'ar' ? 'رؤية حاسوبية متقدمة لتحليل الأشعة السينية، التصوير بالرنين المغناطيسي، والأشعة المقطعية مع اكتشاف الشذوذات' : 'Advanced computer vision for X-ray, MRI, and CT scan analysis with abnormality detection',
      features: [
        language === 'ar' ? 'تسجيل الثقة' : 'Confidence Scoring',
        language === 'ar' ? 'تصنيف الخطورة' : 'Severity Classification',
        language === 'ar' ? 'توليد التقارير' : 'Report Generation',
      ],
      gradient: "from-pink-600 via-rose-600 to-red-600",
    },
    {
      icon: Network,
      title: language === 'ar' ? 'معالجة متوازية' : 'Parallel Processing',
      description: language === 'ar' ? 'بنية موزعة للحوسبة السحابية تعالج آلاف الاستشارات الطبية في وقت واحد' : 'Distributed cloud computing architecture processes thousands of medical consultations simultaneously',
      features: [
        language === 'ar' ? 'قابلية التوسع' : 'Scalable Infrastructure',
        language === 'ar' ? 'زمن استجابة منخفض' : 'Low Latency',
        language === 'ar' ? 'توافر عالي' : 'High Availability',
      ],
      gradient: "from-orange-600 via-amber-600 to-yellow-600",
    },
  ];

  const platformFunctions = [
    {
      icon: Stethoscope,
      title: strings.homepage.features.clinicalReasoning.title,
      description: strings.homepage.features.clinicalReasoning.desc,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Microscope,
      title: strings.homepage.features.xrayAnalysis.title,
      description: strings.homepage.features.xrayAnalysis.desc,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      icon: Activity,
      title: strings.homepage.features.bioScanner.title,
      description: strings.homepage.features.bioScanner.desc,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Mic,
      title: strings.homepage.features.liveScribe.title,
      description: strings.homepage.features.liveScribe.desc,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Pill,
      title: strings.homepage.features.pharmaGuard.title,
      description: strings.homepage.features.pharmaGuard.desc,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: BarChart3,
      title: strings.homepage.features.careLocator.title,
      description: strings.homepage.features.careLocator.desc,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      icon: FileText,
      title: language === 'ar' ? 'مولد ملاحظات SOAP' : 'SOAP Note Generator',
      description: language === 'ar' ? 'إنشاء تلقائي لملاحظات سريرية منظمة من النصوص الصوتية' : 'Automatically generate structured clinical notes from voice transcriptions',
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      icon: BarChart,
      title: language === 'ar' ? 'الجدول الزمني للحالة' : 'Case Timeline',
      description: language === 'ar' ? 'تصور تفاعلي لتقدم المريض مع الرسوم البيانية للعلامات الحيوية' : 'Interactive visualization of patient progression with vital signs charts',
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
    {
      icon: MessageSquare,
      title: language === 'ar' ? 'الرسائل الآمنة' : 'Secure Messaging',
      description: language === 'ar' ? 'التواصل المشفر بين المريض والطبيب' : 'Encrypted patient-clinician communication',
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  const stats = [
    { 
      value: "99.2%", 
      label: strings.homepage.stats.accuracy, 
      icon: Target, 
      color: "text-green-600",
      description: language === 'ar' ? 'دقة التشخيص' : 'Diagnostic Accuracy'
    },
    { 
      value: "<3s", 
      label: language === 'ar' ? 'وقت الاستجابة' : 'Response Time', 
      icon: Zap, 
      color: "text-yellow-600",
      description: language === 'ar' ? 'تحليل فوري' : 'Instant Analysis'
    },
    { 
      value: "50K+", 
      label: language === 'ar' ? 'الأدوية' : 'Medications', 
      icon: Pill, 
      color: "text-blue-600",
      description: language === 'ar' ? 'في قاعدة البيانات' : 'In Database'
    },
    { 
      value: "10K+", 
      label: language === 'ar' ? 'الحالات الطبية' : 'Medical Conditions', 
      icon: Database, 
      color: "text-purple-600",
      description: language === 'ar' ? 'تغطية شاملة' : 'Comprehensive Coverage'
    },
    { 
      value: "24/7", 
      label: language === 'ar' ? 'متاح دائماً' : 'Always Available', 
      icon: Clock, 
      color: "text-red-600",
      description: language === 'ar' ? 'دعم مستمر' : 'Continuous Support'
    },
    { 
      value: "18", 
      label: language === 'ar' ? 'لغات' : 'Languages', 
      icon: Globe, 
      color: "text-teal-600",
      description: language === 'ar' ? 'دعم متعدد اللغات' : 'Multilingual Support'
    },
  ];

  const testimonials = [
    {
      name: language === 'ar' ? 'د. أحمد الحسيني' : 'Dr. Ahmed Al-Husseini',
      role: language === 'ar' ? 'استشاري طب الطوارئ، بغداد' : 'Emergency Medicine Consultant, Baghdad',
      quote: language === 'ar' ? 'MediTriage AI Pro غير طريقة عملنا في قسم الطوارئ. التشخيصات الفورية والتوصيات المدعومة بالذكاء الاصطناعي توفر وقتاً ثميناً في الحالات الحرجة.' : 'MediTriage AI Pro has transformed how we work in the emergency department. The instant diagnoses and AI-powered recommendations save precious time in critical cases.',
      rating: 5,
      image: '/images/doctor-tablet.jpg',
    },
    {
      name: language === 'ar' ? 'د. سارة محمود' : 'Dr. Sarah Mahmoud',
      role: language === 'ar' ? 'طبيبة عائلة، البصرة' : 'Family Physician, Basra',
      quote: language === 'ar' ? 'قاعدة البيانات الطبية الشاملة والسياق العراقي المحلي يجعلان هذا النظام لا يقدر بثمن. إنه مثل وجود فريق من المتخصصين في متناول يدي.' : 'The extensive medical database and Iraqi local context make this system invaluable. It\'s like having a team of specialists at my fingertips.',
      rating: 5,
      image: '/images/doctor-ai-hologram.webp',
    },
    {
      name: language === 'ar' ? 'د. عمر الجبوري' : 'Dr. Omar Al-Jubouri',
      role: language === 'ar' ? 'أخصائي أشعة، أربيل' : 'Radiologist, Erbil',
      quote: language === 'ar' ? 'تحليل الأشعة السينية بالذكاء الاصطناعي دقيق بشكل مذهل. لقد ساعدني في اكتشاف شذوذات دقيقة كنت سأفوتها.' : 'The AI-powered X-ray analysis is remarkably accurate. It has helped me detect subtle abnormalities I might have missed.',
      rating: 5,
      image: '/images/ai-brain-analysis.webp',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Activity className="w-8 h-8 text-teal-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                  MediTriage AI Pro
                </h1>
                <Badge variant="secondary" className="text-xs">
                  {language === 'ar' ? '🇮🇶 مدعوم بالذكاء الاصطناعي المتقدم' : '🇮🇶 Powered by Advanced AI'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Button
                variant="ghost"
                onClick={() => setLocation("/patient-login")}
                className="hidden md:inline-flex"
              >
                {language === 'ar' ? 'دخول المريض' : 'Patient Login'}
              </Button>
              <Button
                onClick={() => setLocation("/clinician-login")}
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
              >
                {language === 'ar' ? 'دخول الطبيب' : 'Clinician Login'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 via-blue-600/10 to-purple-600/10" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(20, 184, 166, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            transform: `translateY(${scrollY * 0.5}px)`,
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-900">
                  {language === 'ar' ? 'الجيل التالي من الرعاية الصحية' : 'Next-Generation Healthcare'}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {language === 'ar' ? 'تبسيط إدارة المرضى' : 'Simplify Patient Triage'}
                </span>
                <br />
                <span className="text-slate-900">
                  {language === 'ar' ? 'بمنصة شاملة واحدة' : 'with One Comprehensive Platform'}
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed">
                {language === 'ar' 
                  ? 'مساعد الرعاية الصحية الذكي المدعوم بالتعاطف. نماذج لغوية كبيرة متقدمة، قاعدة بيانات طبية شاملة، وسياق عراقي محلي لتشخيصات دقيقة وتوصيات قابلة للتنفيذ.'
                  : 'Empathy-powered intelligent healthcare assistant. Advanced Large Language Models, extensive medical database, and Iraqi local context for accurate diagnoses and actionable recommendations.'}
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => setLocation("/symptom-checker")}
                  className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  {language === 'ar' ? 'ابدأ التقييم' : 'Start Assessment'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/clinician-login")}
                  className="border-2 border-teal-600 text-teal-600 hover:bg-teal-50 px-8 py-6 text-lg"
                >
                  <Users className="w-5 h-5 mr-2" />
                  {language === 'ar' ? 'دخول الأطباء' : 'Clinician Portal'}
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-slate-600">
                    {language === 'ar' ? 'معتمد طبياً' : 'Medically Certified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-slate-600">
                    {language === 'ar' ? 'مشفر بالكامل' : 'Fully Encrypted'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-slate-600">
                    {language === 'ar' ? 'متوافق مع HIPAA' : 'HIPAA Compliant'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/doctor-ai-hologram.webp"
                  alt="AI Medical Technology"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/50 to-transparent" />
                
                {/* Floating Stats Cards */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">99.2%</div>
                      <div className="text-xs text-slate-600">
                        {language === 'ar' ? 'دقة' : 'Accuracy'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">&lt;3s</div>
                      <div className="text-xs text-slate-600">
                        {language === 'ar' ? 'استجابة' : 'Response'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center group hover:scale-105 transition-transform duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl mb-4 group-hover:shadow-lg transition-shadow">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-slate-600 mb-1">{stat.label}</div>
                <div className="text-xs text-slate-500">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Capabilities Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(20, 184, 166, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 184, 166, 0.5) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-teal-500/20 text-teal-300 border-teal-500/50">
              <Cpu className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي المتقدم' : 'Powered by Advanced AI'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {language === 'ar' ? 'قدرات الذكاء الاصطناعي والبيانات الطبية' : 'AI Capabilities & Medical Data'}
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              {language === 'ar' 
                ? 'نماذج لغوية كبيرة متطورة وقاعدة بيانات طبية شاملة تدعم كل قرار'
                : 'Sophisticated Large Language Models and extensive medical database powering every decision'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {aiCapabilities.map((capability, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
              >
                <CardContent className="p-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${capability.gradient} rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                    <capability.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{capability.title}</h3>
                  <p className="text-slate-300 mb-6 leading-relaxed">{capability.description}</p>
                  <div className="space-y-2">
                    {capability.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-teal-400" />
                        <span className="text-sm text-slate-200">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Medical Data Showcase */}
          <div className="mt-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Database className="w-12 h-12 text-teal-400 mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <div className="text-slate-300">{language === 'ar' ? 'حالات طبية مع بروتوكولات العلاج' : 'Medical conditions with treatment protocols'}</div>
              </div>
              <div>
                <Pill className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">50,000+</div>
                <div className="text-slate-300">{language === 'ar' ? 'أدوية مع تفاعلات وآثار جانبية' : 'Medications with interactions & side effects'}</div>
              </div>
              <div>
                <Layers className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <div className="text-4xl font-bold mb-2">1M+</div>
                <div className="text-slate-300">{language === 'ar' ? 'سجلات طبية للتدريب والتحقق' : 'Medical records for training & validation'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Functions Grid */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Lightbulb className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'الوظائف الشاملة' : 'Comprehensive Functions'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
              {language === 'ar' ? 'كل ما تحتاجه في مكان واحد' : 'Everything You Need in One Place'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'ar' 
                ? 'مجموعة كاملة من الأدوات الطبية المدعومة بالذكاء الاصطناعي لسير عمل سريري سلس'
                : 'Complete suite of AI-powered medical tools for seamless clinical workflow'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFunctions.map((func, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-teal-200"
              >
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center w-14 h-14 ${func.bgColor} rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                    <func.icon className={`w-7 h-7 ${func.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900">{func.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{func.description}</p>
                  <div className="mt-4 flex items-center text-teal-600 font-medium group-hover:gap-2 transition-all">
                    <span className="text-sm">{language === 'ar' ? 'اعرف المزيد' : 'Learn more'}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Imaging Showcase */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Microscope className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'تحليل الصور الطبية' : 'Medical Imaging Analysis'}
              </Badge>
              <h2 className="text-4xl font-bold mb-6 text-slate-900">
                {language === 'ar' ? 'رؤية حاسوبية متقدمة للتشخيص الدقيق' : 'Advanced Computer Vision for Accurate Diagnosis'}
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                {language === 'ar' 
                  ? 'نماذج الذكاء الاصطناعي لدينا تحلل الأشعة السينية، التصوير بالرنين المغناطيسي، والأشعة المقطعية لاكتشاف الشذوذات مع تسجيل الثقة وتصنيف الخطورة.'
                  : 'Our AI models analyze X-rays, MRIs, and CT scans to detect abnormalities with confidence scoring and severity classification.'}
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {language === 'ar' ? 'اكتشاف الشذوذات' : 'Abnormality Detection'}
                    </h4>
                    <p className="text-slate-600">
                      {language === 'ar' ? 'تحديد الشذوذات الدقيقة التي قد يفوتها العين البشرية' : 'Identify subtle abnormalities that might be missed by the human eye'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {language === 'ar' ? 'تسجيل الثقة' : 'Confidence Scoring'}
                    </h4>
                    <p className="text-slate-600">
                      {language === 'ar' ? 'احصل على درجات ثقة لكل اكتشاف لاتخاذ قرارات مستنيرة' : 'Get confidence scores for each detection to make informed decisions'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">
                      {language === 'ar' ? 'توليد التقارير' : 'Report Generation'}
                    </h4>
                    <p className="text-slate-600">
                      {language === 'ar' ? 'تقارير أشعة منظمة تلقائياً مع النتائج والتوصيات' : 'Automatically generated structured radiology reports with findings and recommendations'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/images/ai-brain-analysis.webp"
                  alt="AI Brain Analysis"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent" />
              </div>
              {/* Dashboard Preview Overlay */}
              <div className="absolute -bottom-6 -right-6 w-64 h-48 bg-white rounded-xl shadow-2xl p-4 hidden lg:block">
                <img
                  src="/images/healthcare-dashboard.png"
                  alt="Healthcare Dashboard"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Star className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'آراء الأطباء' : 'Clinician Testimonials'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
              {language === 'ar' ? 'موثوق به من قبل المهنيين الطبيين' : 'Trusted by Medical Professionals'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'ar' 
                ? 'اكتشف كيف يحول MediTriage AI Pro الرعاية الصحية في العراق'
                : 'Discover how MediTriage AI Pro is transforming healthcare across Iraq'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{testimonial.name}</div>
                      <div className="text-sm text-slate-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-teal-600 via-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {language === 'ar' ? 'جاهز لتحويل ممارستك الطبية؟' : 'Ready to Transform Your Medical Practice?'}
            </h2>
            <p className="text-xl mb-8 text-white/90">
              {language === 'ar' 
                ? 'انضم إلى آلاف المهنيين الطبيين الذين يستخدمون MediTriage AI Pro لتقديم رعاية أفضل'
                : 'Join thousands of medical professionals using MediTriage AI Pro to deliver better care'}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                onClick={() => setLocation("/clinician-login")}
                className="bg-white text-teal-600 hover:bg-slate-100 px-8 py-6 text-lg shadow-xl"
              >
                <Users className="w-5 h-5 mr-2" />
                {language === 'ar' ? 'ابدأ الآن' : 'Get Started Now'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/symptom-checker")}
                className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
              >
                <Activity className="w-5 h-5 mr-2" />
                {language === 'ar' ? 'جرب التقييم' : 'Try Assessment'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-6 h-6 text-teal-400" />
                <span className="text-xl font-bold">MediTriage AI Pro</span>
              </div>
              <p className="text-slate-400 text-sm">
                {language === 'ar' 
                  ? 'مساعد الرعاية الصحية الذكي المدعوم بالتعاطف للعراق'
                  : 'Empathy-powered intelligent healthcare assistant for Iraq'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{language === 'ar' ? 'المنتج' : 'Product'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الميزات' : 'Features'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'التسعير' : 'Pricing'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الأمان' : 'Security'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{language === 'ar' ? 'الشركة' : 'Company'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'من نحن' : 'About'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'اتصل بنا' : 'Contact'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الوظائف' : 'Careers'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{language === 'ar' ? 'قانوني' : 'Legal'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الخصوصية' : 'Privacy'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الشروط' : 'Terms'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الامتثال' : 'Compliance'}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>© 2024 MediTriage AI Pro. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
