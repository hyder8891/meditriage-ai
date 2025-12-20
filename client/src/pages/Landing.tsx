import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Activity, 
  FileText, 
  Languages, 
  User, 
  LogIn,
  ArrowRight,
  Sparkles,
  Brain,
  Shield,
  Zap,
  Heart
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Landing() {
  const { strings, language, toggleLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const features = [
    {
      icon: Brain,
      title: strings.landingFeatures.aiAnalysis.title,
      description: strings.landingFeatures.aiAnalysis.desc,
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      icon: FileText,
      title: strings.landingFeatures.multimodal.title,
      description: strings.landingFeatures.multimodal.desc,
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Health Notice Banner */}
      <div className="gradient-warning text-white py-3 px-4 shadow-lg">
        <div className="container flex items-center justify-center gap-2 text-sm font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-center">{strings.disclaimerBanner}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-strong shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient">
                {strings.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="hover:bg-primary/10 transition-smooth gap-2"
              >
                <Languages className="w-4 h-4" />
                {language === 'en' ? 'العربية' : 'English'}
              </Button>

              {isAuthenticated ? (
                <Button
                  onClick={() => setLocation('/profile')}
                  className="btn-glow gradient-primary border-0 text-white hover:opacity-90 gap-2"
                >
                  <User className="w-4 h-4" />
                  {user?.name || (language === 'ar' ? 'الملف الشخصي' : 'Profile')}
                </Button>
              ) : (
                <Button
                  onClick={() => window.location.href = getLoginUrl()}
                  className="btn-glow gradient-primary border-0 text-white hover:opacity-90 gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-8 animate-slide-up">
            <Badge className="badge-modern glass px-4 py-2 text-sm mx-auto">
              <Sparkles className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Powered by Advanced AI' : 'مدعوم بالذكاء الاصطناعي المتقدم'}
            </Badge>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
              <span className="text-gradient">
                {strings.title}
              </span>
            </h2>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {strings.subtitle}
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => setLocation('/triage')}
                className="btn-glow gradient-primary border-0 text-white text-lg px-8 py-6 hover:opacity-90 transition-smooth group"
              >
                {strings.startTriage}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              {isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation('/profile')}
                  className="text-lg px-8 py-6 glass hover:glass-strong transition-smooth"
                >
                  {language === 'ar' ? 'عرض السجل' : 'View History'}
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
              {[
                { icon: Brain, value: '10K+', label: language === 'en' ? 'Assessments' : 'تقييم' },
                { icon: Zap, value: '95%', label: language === 'en' ? 'Accuracy' : 'دقة' },
                { icon: Shield, value: '24/7', label: language === 'en' ? 'Available' : 'متاح' },
                { icon: Heart, value: '<2min', label: language === 'en' ? 'Response' : 'استجابة' }
              ].map((stat, idx) => (
                <Card key={idx} className="card-modern glass hover:glass-strong transition-smooth">
                  <CardContent className="p-4 text-center">
                    <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold text-gradient">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="badge-modern glass px-4 py-2 mx-auto">
              <Sparkles className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Features' : 'الميزات'}
            </Badge>
            <h3 className="text-4xl md:text-5xl font-bold">
              {language === 'en' ? 'Why Choose' : 'لماذا تختار'}{' '}
              <span className="text-gradient">My Doctor طبيبي</span>
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className="card-modern glass hover:glass-strong card-hover group cursor-pointer"
              >
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-4`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Information */}
      <section className="container py-20">
        <div className="max-w-5xl mx-auto">
          <Card className="card-modern glass-strong border-red-200 dark:border-red-800">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl gradient-danger flex items-center justify-center flex-shrink-0">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {strings.landingSafety.title}
                  </h3>
                  <div className="space-y-2 text-muted-foreground text-base leading-relaxed">
                    <p>
                      {strings.landingSafety.p1}
                      <strong className="text-foreground">{strings.landingSafety.b1}</strong>
                    </p>
                    <p>
                      {strings.landingSafety.p2}
                      <strong className="text-red-600 dark:text-red-400">{strings.landingSafety.b2}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="max-w-5xl mx-auto">
          <Card className="card-modern gradient-animated text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-black/20"></div>
            <CardContent className="relative p-12 md:p-20 text-center space-y-6">
              <h3 className="text-4xl md:text-5xl font-bold">
                {language === 'en' ? 'Ready to Get Started?' : 'هل أنت مستعد للبدء؟'}
              </h3>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                {language === 'en'
                  ? 'Begin your comprehensive medical assessment now'
                  : 'ابدأ تقييمك الطبي الشامل الآن'}
              </p>
              <Button
                size="lg"
                onClick={() => setLocation('/triage')}
                className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 shadow-2xl group"
              >
                {strings.startTriage}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Acknowledgment */}
      <section className="container py-12">
        <div className="text-center text-sm text-muted-foreground max-w-3xl mx-auto">
          {strings.safetyAgreement}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 glass py-12">
        <div className="container text-center text-muted-foreground">
          <p className="text-sm">
            © {new Date().getFullYear()} {strings.title}. {language === 'en' ? 'All rights reserved.' : 'جميع الحقوق محفوظة.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
