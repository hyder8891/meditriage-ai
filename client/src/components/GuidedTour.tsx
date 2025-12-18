import { useEffect, useState } from 'react';
import { useTour } from '@/contexts/TourContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

export function GuidedTour() {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour } = useTour();
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [spotlightPosition, setSpotlightPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    const updatePosition = () => {
      const currentStepData = steps[currentStep];
      if (!currentStepData?.target) return;

      const element = document.querySelector(currentStepData.target);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const padding = 8;

      // Update spotlight position
      setSpotlightPosition({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Calculate tooltip position based on placement
      const placement = currentStepData.placement || 'bottom';
      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = rect.top - 20;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 20;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 20;
          break;
      }

      setTooltipPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, isActive, steps]);

  if (!isActive || steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Dark Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] transition-opacity duration-300"
        onClick={skipTour}
      />

      {/* Spotlight */}
      <div
        className="fixed z-[9999] pointer-events-none transition-all duration-500 ease-out"
        style={{
          top: `${spotlightPosition.top}px`,
          left: `${spotlightPosition.left}px`,
          width: `${spotlightPosition.width}px`,
          height: `${spotlightPosition.height}px`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.5)',
          borderRadius: '12px',
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[10000] transition-all duration-500 ease-out"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translate(-50%, 0)',
        }}
      >
        <Card className="card-modern glass-strong shadow-2xl border-2 border-blue-400/50 max-w-md animate-slide-up">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTour}
                className="h-8 w-8 p-0 hover:bg-red-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-6">
              <h3 className="text-xl font-bold text-gray-900">{currentStepData.title}</h3>
              <p className="text-gray-600 leading-relaxed">{currentStepData.content}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isFirstStep}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={nextStep}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>

            {/* Skip Button */}
            <div className="text-center mt-3">
              <button
                onClick={skipTour}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Skip tour
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Hints */}
      <div className="fixed bottom-6 right-6 z-[10000]">
        <Card className="glass-strong shadow-lg border border-white/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono">←</kbd>
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono">→</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white rounded border border-gray-300 font-mono">ESC</kbd>
                <span>Skip</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
