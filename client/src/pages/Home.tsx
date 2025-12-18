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
} from "lucide-react";
import { useLocation } from "wouter";
import { useTour } from "@/contexts/TourContext";
import { useEffect } from "react";
import { ProductDemoSlideshow } from "@/components/ProductDemoSlideshow";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Home() {
  const [, setLocation] = useLocation();
  const { setSteps, startTour } = useTour();
  const { strings, language, setLanguage } = useLanguage();

  // Define tour steps
  useEffect(() => {
    setSteps([
      {
        id: 'hero',
        target: '[data-tour="hero"]',
        title: 'Welcome to MediTriage AI Pro',
        content: 'Your comprehensive medical operating system that combines AI with clinical expertise to deliver accurate diagnoses and streamline documentation.',
        placement: 'bottom',
      },
      {
        id: 'demo-card',
        target: '[data-tour="demo-card"]',
        title: 'Live Clinical Analysis',
        content: 'See how our AI analyzes patient symptoms and generates differential diagnoses with probability scores in real-time.',
        placement: 'left',
      },
      {
        id: 'stats',
        target: '[data-tour="stats"]',
        title: 'Proven Performance',
        content: 'MediTriage AI Pro delivers 99.2% diagnostic accuracy with analysis completed in under 30 seconds, available 24/7.',
        placement: 'top',
      },
      {
        id: 'features',
        target: '[data-tour="features"]',
        title: 'Comprehensive Feature Set',
        content: 'Explore our six core features: Clinical Reasoning Engine, 3D Bio-Scanner, Live Scribe, PharmaGuard, X-Ray Analysis, and Case Timeline.',
        placement: 'top',
      },
      {
        id: 'feature-clinical',
        target: '[data-tour="feature-clinical"]',
        title: 'Clinical Reasoning Engine',
        content: 'AI-powered differential diagnosis with evidence-based recommendations and probability scoring for confident clinical decisions.',
        placement: 'right',
      },
      {
        id: 'feature-bioscanner',
        target: '[data-tour="feature-bioscanner"]',
        title: '3D Bio-Scanner',
        content: 'Interactive anatomical visualization with symptom mapping and organ-specific diagnostic insights for comprehensive patient assessment.',
        placement: 'right',
      },
      {
        id: 'benefits',
        target: '[data-tour="benefits"]',
        title: 'Transform Your Practice',
        content: 'Reduce diagnostic errors, save time with automated documentation, and improve patient outcomes through comprehensive AI-powered analysis.',
        placement: 'right',
      },
      {
        id: 'cta',
        target: '[data-tour="cta"]',
        title: 'Ready to Get Started?',
        content: 'Join healthcare professionals using MediTriage AI Pro. Access the clinician portal or try the patient symptom checker now!',
        placement: 'top',
      },
    ]);
  }, [setSteps]);

  const features = [
    {
      icon: Brain,
      title: strings.homepage.features.clinicalReasoning.title,
      description: strings.homepage.features.clinicalReasoning.desc,
      color: "from-purple-500 to-indigo-600",
      iconColor: "text-purple-600",
    },
    {
      icon: Stethoscope,
      title: strings.homepage.features.bioScanner.title,
      description: strings.homepage.features.bioScanner.desc,
      color: "from-blue-500 to-cyan-600",
      iconColor: "text-blue-600",
    },
    {
      icon: Mic,
      title: strings.homepage.features.liveScribe.title,
      description: strings.homepage.features.liveScribe.desc,
      color: "from-green-500 to-emerald-600",
      iconColor: "text-green-600",
    },
    {
      icon: Pill,
      title: strings.homepage.features.pharmaGuard.title,
      description: strings.homepage.features.pharmaGuard.desc,
      color: "from-orange-500 to-red-600",
      iconColor: "text-orange-600",
    },
    {
      icon: Microscope,
      title: strings.homepage.features.xrayAnalysis.title,
      description: strings.homepage.features.xrayAnalysis.desc,
      color: "from-pink-500 to-rose-600",
      iconColor: "text-pink-600",
    },
    {
      icon: BarChart3,
      title: strings.homepage.features.careLocator.title,
      description: strings.homepage.features.careLocator.desc,
      color: "from-teal-500 to-cyan-600",
      iconColor: "text-teal-600",
    },
  ];

  const stats = [
    { value: "99.2%", label: strings.homepage.stats.accuracy, icon: CheckCircle },
    { value: "<30s", label: strings.homepage.stats.timeSaved, icon: Zap },
    { value: "24/7", label: strings.homepage.stats.cases, icon: Clock },
    { value: "98%", label: strings.homepage.stats.satisfaction, icon: Heart },
  ];

  const benefits = strings.homepage.benefits.items;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MediTriage AI</h1>
                <p className="text-xs text-gray-600">Medical Operating System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Button
                variant="ghost"
                onClick={() => setLocation("/clinician/login")}
                className="text-gray-700 hover:text-gray-900"
              >
                {strings.homepage.nav.clinicianLogin}
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => setLocation("/patient/symptom-checker")}
              >
                <Heart className="w-4 h-4 mr-2" />
                {strings.homepage.nav.patientPortal}
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8 animate-slide-up" data-tour="hero">
              <Badge className="badge-modern glass bg-blue-100 text-blue-800 border-blue-300">
                <Sparkles className="w-3 h-3 mr-1" />
                {strings.homepage.hero.title}
              </Badge>
              
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  {strings.homepage.hero.title}
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  {strings.homepage.hero.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 shadow-xl hover:shadow-2xl transition-all"
                  onClick={() => setLocation("/clinician/login")}
                >
                  {strings.homepage.hero.getStarted}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 border-2"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {strings.homepage.hero.learnMore}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8" data-tour="stats">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <stat.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative animate-slide-up animation-delay-200" data-tour="demo-card">
              <ProductDemoSlideshow />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50" data-tour="features">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-slide-up">
            <Badge className="badge-modern glass bg-purple-100 text-purple-800 border-purple-300 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              {strings.homepage.features.title}
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {strings.homepage.features.subtitle}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {strings.homepage.hero.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                data-tour={idx === 0 ? 'feature-clinical' : idx === 1 ? 'feature-bioscanner' : undefined}
                className="card-modern glass-strong hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group animate-slide-up border-2 border-transparent hover:border-blue-200"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20" data-tour="benefits">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Benefits List */}
            <div className="space-y-6 animate-slide-up">
              <Badge className="badge-modern glass bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                {strings.homepage.benefits.title}
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900">
                {strings.homepage.cta.title}
              </h2>
              <p className="text-lg text-gray-600">
                {strings.homepage.footer.description}
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Visual Card */}
            <div className="relative animate-slide-up animation-delay-200">
              <Card className="card-modern glass-strong shadow-2xl border-2 border-green-200/50">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">Performance Metrics</div>
                        <div className="text-sm text-gray-500">Real-time Analytics</div>
                      </div>
                    </div>

                    {[
                      { label: "Diagnostic Accuracy", value: 99, color: "green" },
                      { label: "Time Saved per Case", value: 85, color: "blue" },
                      { label: "Documentation Speed", value: 92, color: "purple" },
                      { label: "Clinical Confidence", value: 96, color: "orange" },
                    ].map((metric, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                          <span className="text-sm font-bold text-gray-900">{metric.value}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${
                              metric.color === 'green' ? 'from-green-500 to-emerald-600' :
                              metric.color === 'blue' ? 'from-blue-500 to-cyan-600' :
                              metric.color === 'purple' ? 'from-purple-500 to-indigo-600' :
                              'from-orange-500 to-red-600'
                            } rounded-full transition-all duration-1000 animate-progress`}
                            style={{ width: `${metric.value}%`, animationDelay: `${idx * 200}ms` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden" data-tour="cta">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
            <Badge className="badge-modern glass bg-white/20 text-white border-white/30">
              <Sparkles className="w-3 h-3 mr-1" />
              {strings.homepage.cta.startTrial}
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">
              {strings.homepage.cta.title}
            </h2>
            <p className="text-xl text-blue-100">
              {strings.homepage.cta.subtitle}
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 shadow-xl"
                onClick={() => setLocation("/clinician/login")}
              >
                <Users className="w-5 h-5 mr-2" />
                {strings.homepage.nav.clinicianLogin}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8"
                onClick={() => setLocation("/patient/symptom-checker")}
              >
                <Heart className="w-5 h-5 mr-2" />
                {strings.homepage.nav.patientPortal}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white">MediTriage AI</div>
                  <div className="text-xs">{strings.homepage.footer.tagline}</div>
                </div>
              </div>
              <p className="text-sm">
                {strings.homepage.footer.description}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                <li>Clinical Reasoning</li>
                <li>3D Bio-Scanner</li>
                <li>Live Scribe</li>
                <li>PharmaGuard</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li>Clinician Portal</li>
                <li>Patient Portal</li>
                <li>Admin Dashboard</li>
                <li>API Access</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; 2024 MediTriage AI Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
