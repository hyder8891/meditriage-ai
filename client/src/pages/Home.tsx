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
                <Heart className="w-8 h-8 text-rose-500" />
                <span className="text-xl font-bold text-slate-900">MediTriage AI Pro</span>
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
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                <button
                  onClick={() => setActiveTab('patient')}
                  className={`px-6 py-3 rounded-md font-medium transition-all ${
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
                  className={`px-6 py-3 rounded-md font-medium transition-all ${
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
      <section className="py-20 bg-gradient-to-br from-slate-50 to-white" id="doctors">
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
                    <div className="w-full h-48 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center">
                      <Users className="w-20 h-20 text-slate-400" />
                    </div>
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
                  <Button className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'تواصل الآن' : 'Connect Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" onClick={() => setLocation("/patient-login")} className="border-2">
              {language === 'ar' ? 'عرض جميع الأطباء' : 'View All Doctors'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-rose-500 via-purple-500 to-blue-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {language === 'ar' ? 'ابدأ رحلتك الصحية اليوم' : 'Start Your Health Journey Today'}
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'انضم إلى آلاف المرضى والأطباء الذين يثقون في MediTriage AI Pro'
              : 'Join thousands of patients and doctors who trust MediTriage AI Pro'}
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
                <span className="text-xl font-bold">MediTriage AI Pro</span>
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
            <p>© 2024 MediTriage AI Pro. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
