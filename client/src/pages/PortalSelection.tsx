import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, 
  Heart, 
  Activity,
  ArrowRight,
  Shield,
  Brain,
  Users,
  Sparkles
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PortalSelection() {
  const [, setLocation] = useLocation();
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <nav className="container py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">MediTriage AI</h1>
            <p className="text-xs text-purple-200">Medical Operating System</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="text-white hover:bg-white/10"
        >
          {language === 'en' ? 'العربية' : 'English'}
        </Button>
      </nav>

      {/* Main Content */}
      <div className="container py-20">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6 animate-slide-up">
            <Badge className="badge-modern glass px-4 py-2 text-sm mx-auto border-purple-400/30">
              <Sparkles className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Multimodal Clinical Operating System' : 'نظام تشغيل سريري متعدد الوسائط'}
            </Badge>

            <h2 className="text-5xl md:text-6xl font-black leading-tight">
              {language === 'en' ? 'Choose Your Portal' : 'اختر بوابتك'}
            </h2>

            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              {language === 'en' 
                ? 'Access advanced AI-powered medical tools tailored to your role'
                : 'الوصول إلى أدوات طبية متقدمة مدعومة بالذكاء الاصطناعي مصممة خصيصًا لدورك'}
            </p>
          </div>

          {/* Portal Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Clinician Portal */}
            <Card className="card-modern glass-strong border-blue-400/30 hover:border-blue-400/60 card-hover group cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <CardHeader className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                
                <CardTitle className="text-3xl text-white">
                  {language === 'en' ? 'Clinician Portal' : 'بوابة الأطباء'}
                </CardTitle>
                
                <CardDescription className="text-purple-200 text-base">
                  {language === 'en' 
                    ? 'Medical OS & Diagnostic Suite for Healthcare Professionals'
                    : 'نظام تشغيل طبي ومجموعة تشخيصية لمتخصصي الرعاية الصحية'}
                </CardDescription>
              </CardHeader>

              <CardContent className="relative space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-purple-100">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <span>{language === 'en' ? 'Clinical Reasoning Engine' : 'محرك التفكير السريري'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-purple-100">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <span>{language === 'en' ? 'Differential Diagnosis AI' : 'الذكاء الاصطناعي للتشخيص التفريقي'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-purple-100">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span>{language === 'en' ? 'Case Management Dashboard' : 'لوحة إدارة الحالات'}</span>
                  </div>

                </div>

                <Button
                  size="lg"
                  onClick={() => setLocation('/clinician/login')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg group"
                >
                  {language === 'en' ? 'Access Clinician Portal' : 'الوصول إلى بوابة الأطباء'}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-xs text-purple-300 text-center">
                  {language === 'en' ? 'Demo Account Available' : 'حساب تجريبي متاح'}
                </p>
              </CardContent>
            </Card>

            {/* Patient Portal */}
            <Card className="card-modern glass-strong border-pink-400/30 hover:border-pink-400/60 card-hover group cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <CardHeader className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                
                <CardTitle className="text-3xl text-white">
                  {language === 'en' ? 'Patient Portal' : 'بوابة المرضى'}
                </CardTitle>
                
                <CardDescription className="text-purple-200 text-base">
                  {language === 'en' 
                    ? 'Symptom Checker & Personalized Care Guide'
                    : 'فاحص الأعراض ودليل الرعاية الشخصية'}
                </CardDescription>
              </CardHeader>

              <CardContent className="relative space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-purple-100">
                    <Brain className="w-5 h-5 text-pink-400" />
                    <span>{language === 'en' ? 'AI Symptom Analysis' : 'تحليل الأعراض بالذكاء الاصطناعي'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-purple-100">
                    <Activity className="w-5 h-5 text-pink-400" />
                    <span>{language === 'en' ? 'Personalized Care Guide' : 'دليل الرعاية الشخصية'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-purple-100">
                    <Users className="w-5 h-5 text-pink-400" />
                    <span>{language === 'en' ? 'Doctor Communication Script' : 'نص التواصل مع الطبيب'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-purple-100">
                    <Shield className="w-5 h-5 text-pink-400" />
                    <span>{language === 'en' ? 'Home Care Instructions' : 'تعليمات الرعاية المنزلية'}</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={() => setLocation('/patient/symptom-checker')}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white border-0 shadow-lg group"
                >
                  {language === 'en' ? 'Start Symptom Check' : 'ابدأ فحص الأعراض'}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-xs text-purple-300 text-center">
                  {language === 'en' ? 'No Account Required' : 'لا يتطلب حساب'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Safety Notice */}
          <Card className="card-modern glass-strong border-yellow-400/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                <div className="space-y-2 text-sm text-purple-100">
                  <p className="font-semibold text-yellow-400">
                    {language === 'en' ? 'Important Medical Disclaimer' : 'إخلاء مسؤولية طبية مهم'}
                  </p>
                  <p>
                    {language === 'en'
                      ? 'This system provides guidance only and is not a substitute for professional medical diagnosis. Call emergency services immediately in critical situations.'
                      : 'يوفر هذا النظام إرشادات فقط وليس بديلاً عن التشخيص الطبي المهني. اتصل بخدمات الطوارئ فورًا في الحالات الحرجة.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="container py-8 text-center text-purple-300 text-sm border-t border-purple-400/20">
        <p>© 2024 MediTriage AI Pro - {language === 'en' ? 'Developed by Hyder Janabi' : 'تطوير حيدر الجنابي'}</p>
      </footer>
    </div>
  );
}
