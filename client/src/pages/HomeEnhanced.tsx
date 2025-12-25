import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { 
  CheckCircle, 
  Activity, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Brain,
  Shield,
  Users,
  Zap,
  Heart,
  Star,
  Award,
  ChevronDown
} from "lucide-react";

// Animated counter component
function AnimatedCounter({ value, suffix = "", duration = 2 }: { value: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  
  // Extract numeric value
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
  const isPercentage = value.includes('%');
  const hasDecimal = value.includes('.');
  
  useEffect(() => {
    if (!isInView) return;
    
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(numericValue * easeOutQuart);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, numericValue, duration]);
  
  return (
    <div ref={ref} className="text-5xl font-bold">
      {hasDecimal ? count.toFixed(1) : Math.floor(count)}
      {isPercentage && '%'}
      {suffix}
    </div>
  );
}

export default function HomeEnhanced() {
  const [, setLocation] = useLocation();
  const { language, strings } = useLanguage();
  const { scrollY } = useScroll();
  
  // Parallax effect for hero
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  const stats = [
    { 
      value: "60", 
      suffix: "s",
      label: strings.homepage.modernHero.stat1,
      icon: Clock,
      color: "from-cyan-500 to-blue-500"
    },
    { 
      value: "95", 
      suffix: "%",
      label: strings.homepage.modernHero.stat2,
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500"
    },
    { 
      value: "40", 
      suffix: "%",
      label: strings.homepage.modernHero.stat3,
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500"
    },
  ];

  const features = [
    {
      icon: Brain,
      title: strings.homepage.solution.card1Title,
      description: strings.homepage.solution.card1Desc,
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: Shield,
      title: strings.homepage.solution.card2Title,
      description: strings.homepage.solution.card2Desc,
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: Zap,
      title: strings.homepage.solution.card3Title,
      description: strings.homepage.solution.card3Desc,
      gradient: "from-orange-500 to-red-600"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/50"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                My Doctor طبيبي
              </span>
            </motion.div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6">
                {['Home', 'Solutions', 'About', 'Resources'].map((item, i) => (
                  <motion.a
                    key={item}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    href={`#${item.toLowerCase()}`}
                    className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
                  >
                    {item}
                  </motion.a>
                ))}
              </div>
              <LanguageSwitcher />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  onClick={() => setLocation('/clinician-login')}
                >
                  {strings.homepage.modernHero.ctaPrimary}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated background */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50" />
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
            <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
            <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
          </div>
        </motion.div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                  <CheckCircle className="w-4 h-4" />
                  {strings.homepage.modernHero.trustBadge}
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
                  {strings.homepage.modernHero.title}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-xl text-slate-600 leading-relaxed"
              >
                {strings.homepage.modernHero.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-6 text-lg group"
                  onClick={() => setLocation('/clinician-login')}
                >
                  {strings.homepage.modernHero.ctaPrimary}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-slate-300 hover:border-blue-600 hover:text-blue-600 px-8 py-6 text-lg"
                  onClick={() => setLocation('/patient/symptom-checker')}
                >
                  {strings.homepage.modernHero.ctaSecondary}
                </Button>
              </motion.div>
            </div>

            {/* Right content - Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/images/medical-dashboard.jpg" 
                  alt="Medical Dashboard"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent" />
              </div>
              
              {/* Floating stats cards */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">95.3%</div>
                    <div className="text-sm text-slate-600">Accuracy</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
                className="absolute -right-4 bottom-1/4 bg-white rounded-xl shadow-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">50+</div>
                    <div className="text-sm text-slate-600">Facilities</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex flex-col items-center gap-2 text-slate-400"
            >
              <span className="text-sm">Scroll to explore</span>
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r ${stat.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <div className="relative bg-white border-2 border-slate-200 rounded-2xl p-8 hover:border-transparent hover:shadow-xl transition-all duration-300">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${stat.color} mb-4`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  {statsInView && (
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  )}
                  <div className="text-slate-600 mt-2">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {strings.homepage.solution.title}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {strings.homepage.problem.description}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <div className="relative h-full bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {strings.homepage.ctaSection.title}
            </h2>
            <p className="text-xl mb-8 opacity-90">
              {strings.homepage.ctaSection.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-6 text-lg"
                onClick={() => setLocation('/clinician-login')}
              >
                {strings.homepage.ctaSection.btnDemo}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
              >
                {strings.homepage.ctaSection.btnContact}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6" />
                <span className="text-xl font-bold">My Doctor طبيبي</span>
              </div>
              <p className="text-slate-400">
                {strings.homepage.footerNew.copyright}
              </p>
            </div>
            
            {[
              { title: strings.homepage.footerNew.company, items: [strings.homepage.footerNew.aboutUs, strings.homepage.footerNew.careers, strings.homepage.footerNew.contact] },
              { title: strings.homepage.footerNew.solutions, items: [strings.homepage.footerNew.emergencyDept, strings.homepage.footerNew.urgentCare, strings.homepage.footerNew.telemedicine] },
              { title: strings.homepage.footerNew.legal, items: [strings.homepage.footerNew.privacy, strings.homepage.footerNew.terms, strings.homepage.footerNew.security] },
            ].map((column, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-4">{column.title}</h3>
                <ul className="space-y-2">
                  {column.items.map((item, j) => (
                    <li key={j}>
                      <a href="#" className="text-slate-400 hover:text-white transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
