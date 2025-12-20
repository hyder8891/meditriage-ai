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
  Calendar,
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
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useState } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor'>('patient');

  // Featured doctors data
  const featuredDoctors = [
    {
      name: language === 'ar' ? 'د. أحمد الحسيني' : 'Dr. Ahmed Al-Husseini',
      specialty: language === 'ar' ? 'طب الطوارئ' : 'Emergency Medicine',
      rating: 4.9,
      patients: 250,
      available: true,
      image: '/images/doctor-1.jpg',
    },
    {
      name: language === 'ar' ? 'د. سارة محمود' : 'Dr. Sarah Mahmoud',
      specialty: language === 'ar' ? 'طب العائلة' : 'Family Medicine',
      rating: 4.8,
      patients: 180,
      available: true,
      image: '/images/doctor-2.jpg',
    },
    {
      name: language === 'ar' ? 'د. عمر الجبوري' : 'Dr. Omar Al-Jubouri',
      specialty: language === 'ar' ? 'الأشعة' : 'Radiology',
      rating: 5.0,
      patients: 320,
      available: false,
      image: '/images/doctor-3.jpg',
    },
  ];

  // AI Tools
  const aiTools = [
    {
      icon: Brain,
      title: language === 'ar' ? 'محرك التشخيص الذكي' : 'Smart Diagnosis Engine',
      desc: language === 'ar' ? 'تحليل الأعراض بالذكاء الاصطناعي' : 'AI-powered symptom analysis',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: Microscope,
      title: language === 'ar' ? 'تحليل الأشعة' : 'X-Ray Analysis',
      desc: language === 'ar' ? 'تفسير الصور الطبية' : 'Medical imaging interpretation',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Activity,
      title: language === 'ar' ? 'الماسح الحيوي 3D' : '3D Bio-Scanner',
      desc: language === 'ar' ? 'تصور تشريحي تفاعلي' : 'Interactive anatomy visualization',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FileText,
      title: language === 'ar' ? 'التوثيق الصوتي' : 'Voice Documentation',
      desc: language === 'ar' ? 'تحويل الصوت إلى نص طبي' : 'Voice to medical text',
      color: 'from-green-500 to-emerald-500',
    },
  ];

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
              <div className="hidden md:flex items-center gap-6 text-sm">
                <a href="#features" className="text-slate-600 hover:text-slate-900">{language === 'ar' ? 'المميزات' : 'Features'}</a>
                <a href="#doctors" className="text-slate-600 hover:text-slate-900">{language === 'ar' ? 'الأطباء' : 'Doctors'}</a>
                <a href="#pricing" className="text-slate-600 hover:text-slate-900">{language === 'ar' ? 'الأسعار' : 'Pricing'}</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Button variant="ghost" onClick={() => setLocation("/patient-login")}>
                {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </Button>
              <Button onClick={() => setLocation("/patient-login")} className="bg-rose-500 hover:bg-rose-600">
                {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-rose-50 via-white to-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Image - Right Side */}
            <div className="order-first lg:order-last">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
                <img 
                  src="/images/telemedicine-consultation.jpg" 
                  alt="Doctor-Patient Telemedicine Consultation"
                  className="relative rounded-3xl shadow-2xl w-full h-auto"
                />
                {/* Floating Stats Cards */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 hidden md:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">99.2%</div>
                      <div className="text-sm text-slate-600">{language === 'ar' ? 'دقة التشخيص' : 'Accuracy'}</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-xl p-4 hidden md:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-purple-500 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">500+</div>
                      <div className="text-sm text-slate-600">{language === 'ar' ? 'طبيب' : 'Doctors'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Content - Left Side */}
            <div className="space-y-8">
              <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                <Heart className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'منصة الرعاية الصحية الذكية' : 'Smart Healthcare Platform'}
              </Badge>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                <span className="text-slate-900">
                  {language === 'ar' ? 'رعاية صحية متكاملة' : 'Complete Healthcare'}
                </span>
                <br />
                <span className="bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">
                  {language === 'ar' ? 'بالذكاء الاصطناعي والأطباء' : 'with AI & Real Doctors'}
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed">
                {language === 'ar'
                  ? 'احصل على تقييم فوري بالذكاء الاصطناعي، ثم تواصل مع أطباء مختصين معتمدين للحصول على استشارة شاملة وخطة علاجية مخصصة.'
                  : 'Get instant AI assessment, then connect with certified specialist doctors for comprehensive consultation and personalized treatment plan.'}
              </p>

              {/* Tab Switcher */}
              <div className="flex gap-3 p-1.5 bg-slate-100 rounded-lg w-fit">
                <button
                  onClick={() => setActiveTab('patient')}
                  className={`px-8 py-3.5 rounded-md font-medium transition-all ${
                    activeTab === 'patient'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  {language === 'ar' ? 'للمرضى' : 'For Patients'}
                </button>
                <button
                  onClick={() => setActiveTab('doctor')}
                  className={`px-8 py-3.5 rounded-md font-medium transition-all ${
                    activeTab === 'doctor'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 inline mr-2" />
                  {language === 'ar' ? 'للأطباء' : 'For Doctors'}
                </button>
              </div>

              {/* CTAs based on tab */}
              {activeTab === 'patient' ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={() => setLocation("/patient-login")}
                    className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 text-white px-8 py-6 text-lg"
                  >
                    <Activity className="w-5 h-5 mr-2" />
                    {language === 'ar' ? 'ابدأ التقييم المجاني' : 'Start Free Assessment'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setLocation("/patient-login")}
                    className="border-2 px-8 py-6 text-lg"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    {language === 'ar' ? 'ابحث عن طبيب' : 'Find a Doctor'}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    onClick={() => setLocation("/clinician-login")}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-6 text-lg"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    {language === 'ar' ? 'انضم كطبيب' : 'Join as Doctor'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setLocation("/clinician-login")}
                    className="border-2 px-8 py-6 text-lg"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    {language === 'ar' ? 'وسّع ممارستك' : 'Grow Your Practice'}
                  </Button>
                </div>
              )}

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>{language === 'ar' ? 'معتمد طبياً' : 'Medically Certified'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>{language === 'ar' ? '500+ طبيب' : '500+ Doctors'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>{language === 'ar' ? 'تقييم 4.9/5' : '4.9/5 Rating'}</span>
                </div>
              </div>
            </div>

            {/* Hero Image/Stats */}
            <div className="relative">
              <div className="bg-gradient-to-br from-rose-100 to-purple-100 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] bg-[size:20px_20px]" />
                <div className="relative space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-rose-500">99.2%</div>
                        <div className="text-sm text-slate-600">{language === 'ar' ? 'دقة التشخيص' : 'Diagnosis Accuracy'}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-blue-500">&lt;3s</div>
                        <div className="text-sm text-slate-600">{language === 'ar' ? 'وقت الاستجابة' : 'Response Time'}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-purple-500">500+</div>
                        <div className="text-sm text-slate-600">{language === 'ar' ? 'أطباء معتمدون' : 'Certified Doctors'}</div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-lg">
                      <CardContent className="p-6">
                        <div className="text-3xl font-bold text-green-500">24/7</div>
                        <div className="text-sm text-slate-600">{language === 'ar' ? 'متاح دائماً' : 'Always Available'}</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              <Zap className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'كيف يعمل' : 'How It Works'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'ar' ? 'رحلة رعاية صحية متكاملة' : 'Complete Healthcare Journey'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'من التقييم الأولي إلى الاستشارة الطبية الشاملة في ثلاث خطوات بسيطة'
                : 'From initial assessment to comprehensive medical consultation in three simple steps'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: Brain,
                title: language === 'ar' ? 'تقييم ذكي فوري' : 'Instant AI Assessment',
                desc: language === 'ar' ? 'احصل على تحليل فوري لأعراضك باستخدام الذكاء الاصطناعي المتقدم' : 'Get instant analysis of your symptoms using advanced AI',
                color: 'from-purple-500 to-indigo-500',
              },
              {
                step: '2',
                icon: Search,
                title: language === 'ar' ? 'اتصل بطبيب مختص' : 'Connect with Specialist',
                desc: language === 'ar' ? 'اختر من بين مئات الأطباء المعتمدين حسب التخصص والتقييم' : 'Choose from hundreds of certified doctors by specialty and rating',
                color: 'from-rose-500 to-pink-500',
              },
              {
                step: '3',
                icon: FileText,
                title: language === 'ar' ? 'خطة علاجية مخصصة' : 'Personalized Treatment',
                desc: language === 'ar' ? 'احصل على استشارة شاملة وخطة علاجية مصممة خصيصاً لحالتك' : 'Get comprehensive consultation and treatment plan tailored to your condition',
                color: 'from-blue-500 to-cyan-500',
              },
            ].map((item, idx) => (
              <Card key={idx} className="relative border-2 hover:shadow-xl transition-all">
                <CardContent className="p-8">
                  <div className={`absolute top-6 right-6 w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-xl`}>
                    {item.step}
                  </div>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6`}>
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

      {/* Featured Doctors */}
      <section id="doctors" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-rose-100 text-rose-700 border-rose-200">
              <Stethoscope className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'أطباؤنا' : 'Our Doctors'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'ar' ? 'أطباء معتمدون ومتخصصون' : 'Certified Specialist Doctors'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'تواصل مع أفضل الأطباء المعتمدين في مختلف التخصصات الطبية'
                : 'Connect with top certified doctors across various medical specialties'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {featuredDoctors.map((doctor, idx) => (
              <Card key={idx} className="border-2 hover:shadow-2xl transition-all hover:-translate-y-2">
                <CardContent className="p-6">
                  <div className="relative mb-4">
                    <img 
                      src={doctor.image} 
                      alt={doctor.name}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    {doctor.available && (
                      <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                        {language === 'ar' ? 'متاح الآن' : 'Available Now'}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{doctor.name}</h3>
                  <p className="text-slate-600 mb-4">{doctor.specialty}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-slate-900">{doctor.rating}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {doctor.patients} {language === 'ar' ? 'مريض' : 'patients'}
                    </div>
                  </div>
                  <Button onClick={() => setLocation("/patient/find-doctor")} className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'تواصل الآن' : 'Connect Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" onClick={() => setLocation("/patient/find-doctor")} className="border-2">
              {language === 'ar' ? 'عرض جميع الأطباء' : 'View All Doctors'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Technology Infrastructure Showcase */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/10 text-white border-white/20">
              <Zap className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'البنية التحتية' : 'Infrastructure'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {language === 'ar' ? 'بنية تحتية قوية وموثوقة' : 'Robust & Reliable Infrastructure'}
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'مدعومة بملايين الحالات الطبية وأحدث تقنيات الحوسبة السحابية'
                : 'Powered by millions of medical cases and latest cloud computing technology'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
              <CardContent className="p-6">
                <img 
                  src="/images/ai-doctor-collaboration.jpg" 
                  alt="AI and Doctor Collaboration"
                  className="rounded-xl mb-4 w-full h-48 object-cover"
                />
                <h3 className="text-xl font-bold text-white mb-2">
                  {language === 'ar' ? 'ذكاء اصطناعي + طبيب بشري' : 'AI + Human Doctor'}
                </h3>
                <p className="text-slate-300 text-sm">
                  {language === 'ar'
                    ? 'الجمع بين قوة الذكاء الاصطناعي وخبرة الطبيب لتشخيص أكثر دقة'
                    : 'Combining AI power with doctor expertise for more accurate diagnosis'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
              <CardContent className="p-6">
                <img 
                  src="/images/video-call-doctor.jpg" 
                  alt="Video Consultation"
                  className="rounded-xl mb-4 w-full h-48 object-cover"
                />
                <h3 className="text-xl font-bold text-white mb-2">
                  {language === 'ar' ? 'استشارات فيديو مباشرة' : 'Live Video Consultations'}
                </h3>
                <p className="text-slate-300 text-sm">
                  {language === 'ar'
                    ? 'تواصل مباشر مع طبيبك عبر مكالمات فيديو آمنة ومشفرة'
                    : 'Direct communication with your doctor via secure encrypted video calls'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all">
              <CardContent className="p-6">
                <img 
                  src="/images/doctor-tablet-records.jpg" 
                  alt="Digital Medical Records"
                  className="rounded-xl mb-4 w-full h-48 object-cover"
                />
                <h3 className="text-xl font-bold text-white mb-2">
                  {language === 'ar' ? 'سجلات طبية رقمية' : 'Digital Medical Records'}
                </h3>
                <p className="text-slate-300 text-sm">
                  {language === 'ar'
                    ? 'الطبيب يصل لسجلك الطبي الكامل لتقديم رعاية مخصصة'
                    : 'Doctor accesses your complete medical record for personalized care'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-rose-400 mb-2">10M+</div>
              <div className="text-slate-300">{language === 'ar' ? 'حالة طبية' : 'Medical Cases'}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-blue-400 mb-2">500+</div>
              <div className="text-slate-300">{language === 'ar' ? 'طبيب معتمد' : 'Certified Doctors'}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-purple-400 mb-2">99.9%</div>
              <div className="text-slate-300">{language === 'ar' ? 'وقت التشغيل' : 'Uptime'}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-green-400 mb-2">&lt;3s</div>
              <div className="text-slate-300">{language === 'ar' ? 'وقت الاستجابة' : 'Response Time'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Strengths - 6 Key Features */}
      <section id="features" className="py-20 bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-rose-100 text-rose-700 border-rose-200">
              <Heart className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'قوتنا الأساسية' : 'Our Core Strengths'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'ar' ? 'لماذا نحن الأفضل' : 'Why We\'re the Best'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'منصة متكاملة تجمع بين التكنولوجيا والرعاية البشرية'
                : 'Complete platform combining technology with human care'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1. AI + Doctor Collaboration */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-rose-200">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-xl">
                  <img 
                    src="/images/ai-health-assistance.png" 
                    alt="AI Health Assistance"
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-rose-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    #1
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {language === 'ar' ? 'ذكاء اصطناعي متقدم' : 'Advanced AI Technology'}
                  </h3>
                  <p className="text-slate-600">
                    {language === 'ar'
                      ? 'نظام ذكاء اصطناعي يحلل أعراضك بدقة 99.2% في أقل من 3 ثواني ويساعد الطبيب في التشخيص'
                      : 'AI system analyzes your symptoms with 99.2% accuracy in under 3 seconds and assists doctors in diagnosis'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 2. Video Consultations */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-purple-200">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-xl">
                  <img 
                    src="/images/doctor-patient-app.jpg" 
                    alt="Doctor Patient App"
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    #2
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {language === 'ar' ? 'اتصل بطبيب حقيقي' : 'Connect with Real Doctors'}
                  </h3>
                  <p className="text-slate-600">
                    {language === 'ar'
                      ? 'بعد التقييم الذكي، تواصل مباشرة مع أكثر من 500 طبيب معتمد عبر مكالمات فيديو آمنة'
                      : 'After AI assessment, connect directly with 500+ certified doctors via secure video calls'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 3. 24/7 Availability */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-blue-200">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-xl">
                  <img 
                    src="/images/healthcare-app-ui.png" 
                    alt="Healthcare App UI"
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    #3
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {language === 'ar' ? 'متاح 24/7' : '24/7 Availability'}
                  </h3>
                  <p className="text-slate-600">
                    {language === 'ar'
                      ? 'احصل على استشارة طبية في أي وقت من اليوم من أي مكان عبر هاتفك'
                      : 'Get medical consultation anytime, anywhere from your phone'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 4. Secure & Private */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-green-200">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-xl">
                  <img 
                    src="/images/happy-patient-doctor.jpg" 
                    alt="Happy Patient with Doctor"
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    #4
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {language === 'ar' ? 'رعاية مخصصة' : 'Personalized Care'}
                  </h3>
                  <p className="text-slate-600">
                    {language === 'ar'
                      ? 'كل مريض يحصل على خطة علاج مخصصة بناءً على حالته وتاريخه الطبي'
                      : 'Each patient receives a personalized treatment plan based on their condition and medical history'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 5. Affordable Pricing */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-yellow-200">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-xl">
                  <img 
                    src="/images/telemedicine-consultation.jpg" 
                    alt="Telemedicine Consultation"
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    #5
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {language === 'ar' ? 'أسعار مناسبة' : 'Affordable Pricing'}
                  </h3>
                  <p className="text-slate-600">
                    {language === 'ar'
                      ? 'ابدأ مجاناً مع الخطة المجانية، أو اختر خطة مدفوعة تناسب احتياجاتك'
                      : 'Start free with our Free plan, or choose a paid plan that fits your needs'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 6. Complete Medical Tools */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-indigo-200">
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-xl">
                  <img 
                    src="/images/ai-xray-analysis.jpg" 
                    alt="AI X-Ray Analysis"
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    #6
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {language === 'ar' ? 'أدوات طبية متكاملة' : 'Complete Medical Tools'}
                  </h3>
                  <p className="text-slate-600">
                    {language === 'ar'
                      ? 'من تحليل الأشعة إلى مراقبة العلامات الحيوية، نوفر جميع الأدوات الطبية'
                      : 'From X-ray analysis to vital signs monitoring, we provide all medical tools'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Tools Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              <Brain className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'أدوات الذكاء الاصطناعي' : 'AI-Powered Tools'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'ar' ? 'تقنيات طبية متقدمة' : 'Advanced Medical Technology'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'استفد من أحدث تقنيات الذكاء الاصطناعي في التشخيص والتحليل الطبي'
                : 'Leverage cutting-edge AI technology for medical diagnosis and analysis'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiTools.map((tool, idx) => (
              <Card key={idx} className="border-2 hover:shadow-xl transition-all hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <tool.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{tool.title}</h3>
                  <p className="text-slate-600 text-sm">{tool.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
              <Award className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'لماذا نحن' : 'Why Choose Us'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'ar' ? 'المنصة الأكثر تطوراً في العراق' : 'Iraq\'s Most Advanced Platform'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'نجمع بين قوة الذكاء الاصطناعي وخبرة الأطباء المعتمدين لتقديم رعاية صحية متكاملة وموثوقة'
                : 'Combining the power of AI with certified doctors\' expertise for comprehensive and reliable healthcare'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: language === 'ar' ? 'آمن ومعتمد طبياً' : 'Secure & Medically Certified',
                desc: language === 'ar' 
                  ? 'جميع أطبائنا معتمدون ومرخصون. نحافظ على خصوصية بياناتك الطبية بأعلى معايير الأمان والتشفير.'
                  : 'All our doctors are certified and licensed. We protect your medical data with highest security and encryption standards.',
                features: [
                  language === 'ar' ? 'تشفير من الدرجة الطبية' : 'Medical-grade encryption',
                  language === 'ar' ? 'أطباء معتمدون 100%' : '100% certified doctors',
                  language === 'ar' ? 'خصوصية تامة' : 'Complete privacy',
                ],
                color: 'from-green-500 to-emerald-500',
              },
              {
                icon: Zap,
                title: language === 'ar' ? 'سريع ومتاح 24/7' : 'Fast & Available 24/7',
                desc: language === 'ar'
                  ? 'احصل على تقييم فوري بالذكاء الاصطناعي في أقل من 3 ثوانٍ، وتواصل مع الأطباء في أي وقت على مدار الساعة.'
                  : 'Get instant AI assessment in less than 3 seconds, and connect with doctors anytime, 24/7.',
                features: [
                  language === 'ar' ? 'استجابة فورية <3 ثوانٍ' : 'Instant response <3s',
                  language === 'ar' ? 'متاح 24/7' : 'Available 24/7',
                  language === 'ar' ? 'لا حاجة للانتظار' : 'No waiting time',
                ],
                color: 'from-purple-500 to-indigo-500',
              },
              {
                icon: TrendingUp,
                title: language === 'ar' ? 'دقة عالية 99.2%' : 'High Accuracy 99.2%',
                desc: language === 'ar'
                  ? 'نستخدم أحدث نماذج الذكاء الاصطناعي المدربة على ملايين الحالات الطبية لتقديم تشخيصات دقيقة وموثوقة.'
                  : 'We use latest AI models trained on millions of medical cases to provide accurate and reliable diagnoses.',
                features: [
                  language === 'ar' ? 'دقة 99.2% في التشخيص' : '99.2% diagnosis accuracy',
                  language === 'ar' ? 'مدرب على ملايين الحالات' : 'Trained on millions of cases',
                  language === 'ar' ? 'تحديثات مستمرة' : 'Continuous updates',
                ],
                color: 'from-rose-500 to-pink-500',
              },
            ].map((item, idx) => (
              <Card key={idx} className="border-2 hover:shadow-xl transition-all">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">{item.desc}</p>
                  <ul className="space-y-2">
                    {item.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-rose-500 to-purple-500 text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'خطط الاشتراك' : 'Subscription Plans'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'ar' ? 'استثمر في صحتك أو ممارستك الطبية' : 'Invest in Your Health or Medical Practice'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'ar'
                ? 'خطط مرنة تناسب احتياجات المرضى والأطباء مع إمكانية الترقية في أي وقت'
                : 'Flexible plans for patients and doctors with upgrade anytime'}
            </p>
          </div>

          {/* Patient Plans */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center mb-4 text-rose-600">
              {language === 'ar' ? 'للمرضى' : 'For Patients'}
            </h3>
            <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto">
              {language === 'ar' ? 'احصل على تقييم فوري بالذكاء الاصطناعي وتواصل مع أطباء مختصين معتمدين' : 'Get instant AI assessment and connect with certified specialist doctors'}
            </p>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  name: language === 'ar' ? 'مجاني' : 'Free',
                  price: language === 'ar' ? '0 دينار' : '$0',
                  period: language === 'ar' ? '/شهرياً' : '/month',
                  desc: language === 'ar' ? 'للتجربة والاستخدام الأساسي' : 'For trial and basic use',
                  features: [
                    language === 'ar' ? '3 استشارات شهرياً' : '3 consultations/month',
                    language === 'ar' ? 'تقييم ذكي أساسي' : 'Basic AI assessment',
                    language === 'ar' ? 'اتصال بطبيب واحد' : 'Connect with 1 doctor',
                    language === 'ar' ? 'دعم عبر البريد' : 'Email support',
                  ],
                  color: 'border-slate-200',
                  buttonClass: 'bg-slate-600 hover:bg-slate-700',
                  popular: false,
                },
                {
                  name: language === 'ar' ? 'لايت' : 'Lite',
                  price: language === 'ar' ? '15,000 دينار' : '$15',
                  period: language === 'ar' ? '/شهرياً' : '/month',
                  desc: language === 'ar' ? 'للاستخدام المنتظم' : 'For regular use',
                  features: [
                    language === 'ar' ? '15 استشارة شهرياً' : '15 consultations/month',
                    language === 'ar' ? 'تقييم ذكي متقدم' : 'Advanced AI assessment',
                    language === 'ar' ? 'اتصال بـ 3 أطباء' : 'Connect with 3 doctors',
                    language === 'ar' ? 'رسائل غير محدودة' : 'Unlimited messaging',
                    language === 'ar' ? 'أولوية في الرد' : 'Priority response',
                  ],
                  color: 'border-rose-300 bg-rose-50',
                  buttonClass: 'bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600',
                  popular: true,
                },
                {
                  name: language === 'ar' ? 'برو' : 'Pro',
                  price: language === 'ar' ? '30,000 دينار' : '$30',
                  period: language === 'ar' ? '/شهرياً' : '/month',
                  desc: language === 'ar' ? 'للاستخدام المكثف' : 'For intensive use',
                  features: [
                    language === 'ar' ? 'استشارات غير محدودة' : 'Unlimited consultations',
                    language === 'ar' ? 'جميع أدوات الذكاء الاصطناعي' : 'All AI tools',
                    language === 'ar' ? 'اتصال بأطباء غير محدود' : 'Unlimited doctor connections',
                    language === 'ar' ? 'دعم على مدار الساعة' : '24/7 support',
                    language === 'ar' ? 'تقارير مفصلة' : 'Detailed reports',
                  ],
                  color: 'border-purple-300',
                  buttonClass: 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600',
                  popular: false,
                },
              ].map((plan, idx) => (
                <Card key={idx} className={`border-2 ${plan.color} relative hover:shadow-2xl transition-all`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-rose-500 to-purple-500 text-white px-4 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        {language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-8">
                    <h4 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h4>
                    <p className="text-slate-600 text-sm mb-4">{plan.desc}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-600">{plan.period}</span>
                    </div>
                    <Button className={`w-full mb-6 ${plan.buttonClass}`} onClick={() => setLocation('/patient-login')}>
                      {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Doctor Plans */}
          <div>
            <h3 className="text-3xl font-bold text-center mb-4 text-purple-600">
              {language === 'ar' ? 'للأطباء' : 'For Doctors'}
            </h3>
            <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto">
              {language === 'ar' ? 'وسّع قاعدة مرضاك وأدر ممارستك بكفاءة باستخدام أدوات ذكية' : 'Expand your patient base and manage your practice efficiently with smart tools'}
            </p>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  name: language === 'ar' ? 'أساسي' : 'Basic',
                  price: language === 'ar' ? '50,000 دينار' : '$50',
                  period: language === 'ar' ? '/شهرياً' : '/month',
                  desc: language === 'ar' ? 'للأطباء المبتدئين' : 'For starting doctors',
                  features: [
                    language === 'ar' ? 'حتى 50 مريض' : 'Up to 50 patients',
                    language === 'ar' ? 'جميع أدوات التشخيص' : 'All diagnostic tools',
                    language === 'ar' ? 'رسائل غير محدودة' : 'Unlimited messaging',
                    language === 'ar' ? 'لوحة تحكم احترافية' : 'Professional dashboard',
                    language === 'ar' ? 'تقارير شهرية' : 'Monthly reports',
                  ],
                  color: 'border-blue-200',
                  buttonClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
                },
                {
                  name: language === 'ar' ? 'بريميوم' : 'Premium',
                  price: language === 'ar' ? '100,000 دينار' : '$100',
                  period: language === 'ar' ? '/شهرياً' : '/month',
                  desc: language === 'ar' ? 'للأطباء المحترفين' : 'For professional doctors',
                  features: [
                    language === 'ar' ? 'مرضى غير محدودين' : 'Unlimited patients',
                    language === 'ar' ? 'جميع الميزات المتقدمة' : 'All advanced features',
                    language === 'ar' ? 'أولوية في البحث' : 'Priority in search',
                    language === 'ar' ? 'تحليلات متقدمة' : 'Advanced analytics',
                    language === 'ar' ? 'دعم مخصص' : 'Dedicated support',
                    language === 'ar' ? 'تدريب مجاني' : 'Free training',
                  ],
                  color: 'border-purple-300 bg-purple-50',
                  buttonClass: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
                },
              ].map((plan, idx) => (
                <Card key={idx} className={`border-2 ${plan.color} hover:shadow-2xl transition-all`}>
                  <CardContent className="p-8">
                    <h4 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h4>
                    <p className="text-slate-600 text-sm mb-4">{plan.desc}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-600">{plan.period}</span>
                    </div>
                    <Button className={`w-full mb-6 ${plan.buttonClass}`} onClick={() => setLocation('/clinician-login')}>
                      {language === 'ar' ? 'انضم الآن' : 'Join Now'}
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-yellow-100 text-yellow-700 border-yellow-200">
              <Star className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'آراء العملاء' : 'Testimonials'}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'ar' ? 'ماذا يقول مستخدمونا' : 'What Our Users Say'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: language === 'ar' ? 'أحمد محمد' : 'Ahmed Mohammed',
                role: language === 'ar' ? 'مريض' : 'Patient',
                rating: 5,
                text: language === 'ar'
                  ? 'منصة رائعة! حصلت على تقييم فوري لأعراضي ثم تواصلت مع طبيب مختص في دقائق. التجربة كانت سلسة جداً.'
                  : 'Amazing platform! Got instant assessment of my symptoms then connected with a specialist in minutes. Very smooth experience.',
              },
              {
                name: language === 'ar' ? 'د. سارة الجبوري' : 'Dr. Sarah Al-Jubouri',
                role: language === 'ar' ? 'طبيبة عائلة' : 'Family Doctor',
                rating: 5,
                text: language === 'ar'
                  ? 'ساعدتني المنصة في الوصول لمرضى جدد وإدارة ممارستي بكفاءة. الأدوات الذكية توفر الكثير من الوقت.'
                  : 'The platform helped me reach new patients and manage my practice efficiently. Smart tools save a lot of time.',
              },
              {
                name: language === 'ar' ? 'فاطمة حسن' : 'Fatima Hassan',
                role: language === 'ar' ? 'مريضة' : 'Patient',
                rating: 5,
                text: language === 'ar'
                  ? 'أفضل استثمار في صحتي. الاشتراك الشهري يوفر لي استشارات غير محدودة وراحة بال تامة.'
                  : 'Best investment in my health. Monthly subscription gives me unlimited consultations and complete peace of mind.',
              },
            ].map((testimonial, idx) => (
              <Card key={idx} className="border-2 hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-purple-400 flex items-center justify-center text-white font-bold">
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

      {/* About Platform - Detailed */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
                <Heart className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'عن المنصة' : 'About the Platform'}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                {language === 'ar' ? 'مستقبل الرعاية الصحية في العراق' : 'The Future of Healthcare in Iraq'}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <img 
                  src="/images/healthcare-dashboard.png" 
                  alt="Medical Analytics Dashboard"
                  className="rounded-2xl shadow-xl w-full h-auto"
                />
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {language === 'ar' ? 'رؤيتنا' : 'Our Vision'}
                  </h3>
                  <p className="text-slate-700 leading-relaxed">
                    {language === 'ar'
                      ? 'نسعى لتوفير رعاية صحية عالية الجودة وميسورة التكلفة لجميع العراقيين من خلال الجمع بين قوة الذكاء الاصطناعي وخبرة الأطباء المحليين المعتمدين. نؤمن بأن التكنولوجيا يجب أن تعزز العلاقة بين الطبيب والمريض، لا أن تحل محلها.'
                      : 'We strive to provide high-quality, affordable healthcare to all Iraqis by combining the power of artificial intelligence with the expertise of certified local doctors. We believe technology should enhance the doctor-patient relationship, not replace it.'}
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {language === 'ar' ? 'لماذا My Doctor طبيبي؟' : 'Why My Doctor طبيبي?'}
                  </h3>
                  <ul className="space-y-3">
                    {[
                      language === 'ar' ? 'تقليل وقت الانتظار من ساعات إلى ثوانٍ' : 'Reduce waiting time from hours to seconds',
                      language === 'ar' ? 'وصول فوري لأطباء مختصين في أي وقت' : 'Instant access to specialist doctors anytime',
                      language === 'ar' ? 'تكلفة أقل من العيادات التقليدية' : 'Lower cost than traditional clinics',
                      language === 'ar' ? 'خصوصية وأمان بياناتك الطبية' : 'Privacy and security of your medical data',
                      language === 'ar' ? 'متابعة مستمرة لحالتك الصحية' : 'Continuous monitoring of your health',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4 text-center">
                {language === 'ar' ? 'كيف نختلف عن المنصات الأخرى؟' : 'How Are We Different?'}
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: language === 'ar' ? 'نموذج B2B2C' : 'B2B2C Model',
                    desc: language === 'ar' 
                      ? 'نجمع بين المرضى والأطباء في منصة واحدة متكاملة'
                      : 'We bring patients and doctors together on one integrated platform',
                  },
                  {
                    title: language === 'ar' ? 'ذكاء محلي' : 'Local Intelligence',
                    desc: language === 'ar'
                      ? 'مدرب على حالات عراقية ويفهم السياق المحلي'
                      : 'Trained on Iraqi cases and understands local context',
                  },
                  {
                    title: language === 'ar' ? 'دعم مستمر' : 'Continuous Support',
                    desc: language === 'ar'
                      ? 'متابعة طويلة الأمد لا تقتصر على استشارة واحدة'
                      : 'Long-term follow-up, not just one-time consultation',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
                <MessageSquare className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                {language === 'ar' ? 'إجابات على أسئلتك' : 'Answers to Your Questions'}
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: language === 'ar' ? 'هل الذكاء الاصطناعي يحل محل الطبيب؟' : 'Does AI replace the doctor?',
                  a: language === 'ar'
                    ? 'لا، الذكاء الاصطناعي هو أداة مساعدة توفر تقييماً أولياً سريعاً. التشخيص النهائي والخطة العلاجية يتم بواسطة طبيب مختص معتمد. نحن نجمع بين سرعة التكنولوجيا وخبرة الطبيب البشري.'
                    : 'No, AI is an assistive tool that provides quick initial assessment. Final diagnosis and treatment plan are made by a certified specialist doctor. We combine the speed of technology with human doctor expertise.',
                },
                {
                  q: language === 'ar' ? 'هل بياناتي آمنة؟' : 'Is my data secure?',
                  a: language === 'ar'
                    ? 'نعم، نستخدم تشفيراً من الدرجة الطبية لحماية جميع بياناتك الطبية. لا يمكن لأحد الوصول إلى معلوماتك إلا الأطباء المعتمدين الذين تمنحهم الإذن. نلتزم بأعلى معايير الخصوصية الطبية.'
                    : 'Yes, we use medical-grade encryption to protect all your medical data. Only certified doctors you authorize can access your information. We comply with the highest medical privacy standards.',
                },
                {
                  q: language === 'ar' ? 'كم تكلفة الخدمة؟' : 'How much does it cost?',
                  a: language === 'ar'
                    ? 'نقدم خطة مجانية للتجربة (3 استشارات شهرياً). الخطط المدفوعة تبدأ من 15,000 دينار عراقي شهرياً (15 استشارة). هذا أقل بكثير من تكلفة زيارة عيادة واحدة تقليدية.'
                    : 'We offer a free trial plan (3 consultations/month). Paid plans start from 15,000 IQD monthly (15 consultations). This is much less than the cost of a single traditional clinic visit.',
                },
                {
                  q: language === 'ar' ? 'هل يمكنني اختيار طبيبي؟' : 'Can I choose my doctor?',
                  a: language === 'ar'
                    ? 'نعم، يمكنك تصفح واختيار الطبيب بناءً على التخصص، التقييم، والتوفر. كل طبيب لديه ملف شخصي مفصل يوضح خبرته وتقييمات المرضى السابقين.'
                    : 'Yes, you can browse and choose your doctor based on specialty, rating, and availability. Each doctor has a detailed profile showing their expertise and previous patient ratings.',
                },
                {
                  q: language === 'ar' ? 'ماذا لو كانت حالتي طارئة؟' : 'What if my case is urgent?',
                  a: language === 'ar'
                    ? 'المنصة متاحة 24/7 للحالات الطارئة. سيقيّم الذكاء الاصطناعي درجة الخطورة ويربطك فوراً بطبيب طوارئ. في الحالات الحرجة جداً، ننصح بالاتصال بالإسعاف أو زيارة أقرب مستشفى.'
                    : 'The platform is available 24/7 for urgent cases. AI will assess the severity and immediately connect you with an emergency doctor. For very critical cases, we recommend calling ambulance or visiting the nearest hospital.',
                },
                {
                  q: language === 'ar' ? 'هل يمكن للطبيب وصف أدوية؟' : 'Can doctors prescribe medications?',
                  a: language === 'ar'
                    ? 'نعم، الأطباء المعتمدون يمكنهم وصف الأدوية إلكترونياً. ستحصل على وصفة طبية رقمية يمكنك استخدامها في أي صيدلية. نعمل أيضاً على شراكات لتوصيل الأدوية إلى منزلك.'
                    : 'Yes, certified doctors can prescribe medications electronically. You will receive a digital prescription you can use at any pharmacy. We are also working on partnerships for home medication delivery.',
                },
                {
                  q: language === 'ar' ? 'كيف يستفيد الأطباء من المنصة؟' : 'How do doctors benefit from the platform?',
                  a: language === 'ar'
                    ? 'المنصة تساعد الأطباء على الوصول لمرضى جدد، إدارة ممارستهم بكفاءة، وزيادة دخلهم. نوفر أدوات ذكية للتشخيص، نظام حجز متطور، وتقارير تحليلية لمتابعة الأداء.'
                    : 'The platform helps doctors reach new patients, manage their practice efficiently, and increase their income. We provide smart diagnostic tools, advanced booking system, and analytical reports to track performance.',
                },
                {
                  q: language === 'ar' ? 'هل الخدمة متاحة في جميع محافظات العراق؟' : 'Is the service available in all Iraqi governorates?',
                  a: language === 'ar'
                    ? 'نعم، الخدمة متاحة عبر الإنترنت في جميع أنحاء العراق. لدينا أطباء من مختلف المحافظات ونعمل على توسيع التغطية باستمرار. كل ما تحتاجه هو اتصال بالإنترنت.'
                    : 'Yes, the service is available online throughout Iraq. We have doctors from different governorates and are continuously expanding coverage. All you need is an internet connection.',
                },
              ].map((faq, idx) => (
                <Card key={idx} className="border-2 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-start gap-3">
                      <span className="text-rose-500 flex-shrink-0">Q:</span>
                      <span>{faq.q}</span>
                    </h3>
                    <p className="text-slate-700 leading-relaxed pl-8">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-rose-500 via-purple-500 to-blue-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {language === 'ar' ? 'ابدأ رحلتك الصحية اليوم' : 'Start Your Health Journey Today'}
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'انضم إلى آلاف المرضى والأطباء الذين يثقون في My Doctor طبيبي'
              : 'Join thousands of patients and doctors who trust My Doctor طبيبي'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation("/patient-login")} className="bg-white text-rose-600 hover:bg-slate-100 px-8 py-6 text-lg">
              <Activity className="w-5 h-5 mr-2" />
              {language === 'ar' ? 'للمرضى - ابدأ الآن' : 'For Patients - Get Started'}
            </Button>
            <Button size="lg" onClick={() => setLocation("/clinician-login")} className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white/20 px-8 py-6 text-lg">
              <Stethoscope className="w-5 h-5 mr-2" />
              {language === 'ar' ? 'للأطباء - انضم الآن' : 'For Doctors - Join Now'}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-rose-500" />
                <span className="text-xl font-bold">My Doctor طبيبي</span>
              </div>
              <p className="text-slate-400 text-sm">
                {language === 'ar'
                  ? 'منصة الرعاية الصحية الذكية للعراق'
                  : 'Smart Healthcare Platform for Iraq'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{language === 'ar' ? 'المنتج' : 'Product'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">{language === 'ar' ? 'المميزات' : 'Features'}</a></li>
                <li><a href="#doctors" className="hover:text-white transition-colors">{language === 'ar' ? 'الأطباء' : 'Doctors'}</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">{language === 'ar' ? 'الأسعار' : 'Pricing'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{language === 'ar' ? 'الشركة' : 'Company'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'من نحن' : 'About'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'اتصل بنا' : 'Contact'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{language === 'ar' ? 'قانوني' : 'Legal'}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الخصوصية' : 'Privacy'}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{language === 'ar' ? 'الشروط' : 'Terms'}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>© 2024 My Doctor طبيبي. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
