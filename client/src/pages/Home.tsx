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

export default function Home() {
  const [, setLocation] = useLocation();
  const { setSteps, startTour } = useTour();

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
      title: "Clinical Reasoning Engine",
      description: "AI-powered differential diagnosis with evidence-based recommendations and probability scoring",
      color: "from-purple-500 to-indigo-600",
      iconColor: "text-purple-600",
    },
    {
      icon: Stethoscope,
      title: "3D Bio-Scanner",
      description: "Interactive anatomical visualization with symptom mapping and organ-specific diagnostic insights",
      color: "from-blue-500 to-cyan-600",
      iconColor: "text-blue-600",
    },
    {
      icon: Mic,
      title: "Live Scribe",
      description: "Real-time voice-to-text transcription with automatic SOAP note generation for clinical documentation",
      color: "from-green-500 to-emerald-600",
      iconColor: "text-green-600",
    },
    {
      icon: Pill,
      title: "PharmaGuard",
      description: "Advanced drug interaction checker with contraindication alerts and dosage recommendations",
      color: "from-orange-500 to-red-600",
      iconColor: "text-orange-600",
    },
    {
      icon: Microscope,
      title: "X-Ray Analysis",
      description: "AI-powered medical imaging interpretation with abnormality detection and diagnostic suggestions",
      color: "from-pink-500 to-rose-600",
      iconColor: "text-pink-600",
    },
    {
      icon: BarChart3,
      title: "Case Timeline",
      description: "Comprehensive patient history visualization with symptom progression and treatment tracking",
      color: "from-teal-500 to-cyan-600",
      iconColor: "text-teal-600",
    },
  ];

  const stats = [
    { value: "99.2%", label: "Diagnostic Accuracy", icon: CheckCircle },
    { value: "<30s", label: "Analysis Time", icon: Zap },
    { value: "24/7", label: "Availability", icon: Clock },
    { value: "50+", label: "Conditions Covered", icon: Heart },
  ];

  const benefits = [
    "Reduce diagnostic errors with AI-powered clinical decision support",
    "Save time with automated documentation and SOAP note generation",
    "Improve patient outcomes through comprehensive symptom analysis",
    "Access evidence-based recommendations from medical literature",
    "Streamline workflow with integrated tools in one platform",
    "Enhance clinical confidence with probability-scored diagnoses",
  ];

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
              <Button
                variant="outline"
                onClick={startTour}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Take a Tour
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLocation("/clinician/login")}
              >
                Clinician Login
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => setLocation("/patient/symptom-checker")}
              >
                <Heart className="w-4 h-4 mr-2" />
                Patient Portal
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
                AI-Powered Clinical Intelligence
              </Badge>
              
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  The Future of
                  <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Clinical Decision Making
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  MediTriage AI Pro is a comprehensive medical operating system that combines artificial intelligence with clinical expertise to deliver accurate diagnoses, streamline documentation, and improve patient outcomes.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 shadow-xl hover:shadow-2xl transition-all"
                  onClick={() => setLocation("/clinician/login")}
                >
                  Get Started
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
                  Learn More
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
            <div className="relative animate-slide-up animation-delay-200">
              <div className="relative">
                {/* Main Card */}
                <Card className="card-modern glass-strong shadow-2xl border-2 border-blue-200/50 overflow-hidden" data-tour="demo-card">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Clinical Analysis</div>
                            <div className="text-xs text-gray-500">AI-Powered Diagnosis</div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <Activity className="w-3 h-3 mr-1 animate-pulse" />
                          Active
                        </Badge>
                      </div>

                      {/* Symptoms */}
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-gray-700">Patient Symptoms</div>
                        <div className="flex flex-wrap gap-2">
                          {["Chest Pain", "Shortness of Breath", "Fatigue"].map((symptom) => (
                            <Badge key={symptom} variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Diagnosis Results */}
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-gray-700">Differential Diagnosis</div>
                        <div className="space-y-2">
                          {[
                            { condition: "Acute Coronary Syndrome", probability: 78, color: "red" },
                            { condition: "Pulmonary Embolism", probability: 65, color: "orange" },
                            { condition: "Anxiety Disorder", probability: 42, color: "yellow" },
                          ].map((diagnosis) => (
                            <div key={diagnosis.condition} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{diagnosis.condition}</span>
                                <span className="font-semibold text-gray-900">{diagnosis.probability}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${
                                    diagnosis.color === 'red' ? 'from-red-500 to-red-600' :
                                    diagnosis.color === 'orange' ? 'from-orange-500 to-orange-600' :
                                    'from-yellow-500 to-yellow-600'
                                  } rounded-full transition-all duration-1000 animate-progress`}
                                  style={{ width: `${diagnosis.probability}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Report
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          View Timeline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl shadow-xl animate-float opacity-80 flex items-center justify-center">
                  <Zap className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-xl animate-float animation-delay-1000 opacity-80 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
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
              Comprehensive Features
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              MediTriage AI Pro integrates cutting-edge AI technology with clinical workflows to provide a complete medical operating system
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
                Clinical Benefits
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900">
                Transform Your Clinical Practice
              </h2>
              <p className="text-lg text-gray-600">
                MediTriage AI Pro empowers healthcare professionals with intelligent tools that enhance decision-making, reduce errors, and improve patient care.
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
              Get Started Today
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">
              Ready to Transform Your Clinical Practice?
            </h2>
            <p className="text-xl text-blue-100">
              Join healthcare professionals who are already using MediTriage AI Pro to deliver better patient outcomes
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 shadow-xl"
                onClick={() => setLocation("/clinician/login")}
              >
                <Users className="w-5 h-5 mr-2" />
                Start for Clinicians
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 text-lg px-8"
                onClick={() => setLocation("/patient/symptom-checker")}
              >
                <Heart className="w-5 h-5 mr-2" />
                Patient Portal
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
                  <div className="text-xs">Medical OS</div>
                </div>
              </div>
              <p className="text-sm">
                AI-powered clinical intelligence platform for healthcare professionals
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
