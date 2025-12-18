import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Brain, Scan, Mic, Shield, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface Slide {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  features: string[];
}



export function ProductDemoSlideshow() {
  const { strings: t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const slides: Slide[] = [
    {
      id: 1,
      title: t.homepage.slideshow.slides.clinicalReasoning.title,
      description: t.homepage.slideshow.slides.clinicalReasoning.desc,
      icon: Brain,
      color: 'from-blue-500 to-cyan-500',
      features: t.homepage.slideshow.slides.clinicalReasoning.features,
    },
    {
      id: 2,
      title: t.homepage.slideshow.slides.bioScanner.title,
      description: t.homepage.slideshow.slides.bioScanner.desc,
      icon: Scan,
      color: 'from-purple-500 to-pink-500',
      features: t.homepage.slideshow.slides.bioScanner.features,
    },
    {
      id: 3,
      title: t.homepage.slideshow.slides.liveScribe.title,
      description: t.homepage.slideshow.slides.liveScribe.desc,
      icon: Mic,
      color: 'from-green-500 to-emerald-500',
      features: t.homepage.slideshow.slides.liveScribe.features,
    },
    {
      id: 4,
      title: t.homepage.slideshow.slides.pharmaGuard.title,
      description: t.homepage.slideshow.slides.pharmaGuard.desc,
      icon: Shield,
      color: 'from-orange-500 to-red-500',
      features: t.homepage.slideshow.slides.pharmaGuard.features,
    },
    {
      id: 5,
      title: t.homepage.slideshow.slides.soapGenerator.title,
      description: t.homepage.slideshow.slides.soapGenerator.desc,
      icon: FileText,
      color: 'from-indigo-500 to-blue-500',
      features: t.homepage.slideshow.slides.soapGenerator.features,
    },
    {
      id: 6,
      title: t.homepage.slideshow.slides.caseTimeline.title,
      description: t.homepage.slideshow.slides.caseTimeline.desc,
      icon: Clock,
      color: 'from-teal-500 to-cyan-500',
      features: t.homepage.slideshow.slides.caseTimeline.features,
    },
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setDirection('next');
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 'next' : 'prev');
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setDirection('next');
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection('prev');
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="relative">
      <Card className="card-modern glass-strong shadow-2xl border-2 border-blue-200/50 overflow-hidden">
        <CardContent className="p-0">
          {/* Slide Content */}
          <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                  backgroundSize: '40px 40px',
                }}
              />
            </div>

            {/* Slide Animation Container */}
            <div
              key={currentSlide}
              className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-white ${
                direction === 'next' ? 'animate-slide-up' : 'animate-slide-down'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${slide.color} flex items-center justify-center mb-6 shadow-2xl animate-float`}
              >
                <Icon className="w-12 h-12 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-center">
                {slide.title}
              </h3>

              {/* Description */}
              <p className="text-lg text-white/90 mb-6 text-center max-w-2xl">
                {slide.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-3 justify-center">
                {slide.features.map((feature, idx) => (
                  <Badge
                    key={idx}
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>

              {/* Slide Number */}
              <div className="absolute top-6 right-6">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                  {currentSlide + 1} / {slides.length}
                </Badge>
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
              <Button
                size="lg"
                variant="ghost"
                onClick={prevSlide}
                className="pointer-events-auto bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 rounded-full w-12 h-12 p-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={nextSlide}
                className="pointer-events-auto bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 rounded-full w-12 h-12 p-0"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4">
            <div className="flex items-center justify-between">
              {/* Progress Dots */}
              <div className="flex items-center gap-2">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`transition-all duration-300 rounded-full ${
                      idx === currentSlide
                        ? 'w-8 h-2 bg-gradient-to-r from-blue-600 to-purple-600'
                        : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>


            </div>

            {/* Auto-advance Progress Bar */}
            {isPlaying && (
              <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 animate-progress"
                  style={{ animationDuration: '4s' }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Caption Below */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {t.homepage.slideshow.caption}
        </p>
      </div>
    </div>
  );
}
