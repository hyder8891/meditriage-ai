import { useEffect, useState } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * OnboardingTour Component
 * Provides an interactive tour for new Arabic-speaking users
 * Highlights key features and navigation patterns
 */
export function OnboardingTour() {
  const { language } = useLanguage();
  const [tourShown, setTourShown] = useState(false);
  
  const { data: onboardingStatus, isLoading } = trpc.onboarding.getStatus.useQuery();
  const completeOnboarding = trpc.onboarding.completeOnboarding.useMutation();
  const skipOnboarding = trpc.onboarding.skipOnboarding.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    // Only show tour once per session and if user hasn't completed/skipped it
    if (isLoading || tourShown || !onboardingStatus?.shouldShowTour) {
      return;
    }

    // Small delay to ensure DOM elements are ready
    const timer = setTimeout(() => {
      startTour();
      setTourShown(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [onboardingStatus, isLoading, tourShown]);

  const startTour = () => {
    const isArabic = language === "ar";
    const isRTL = isArabic;

    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      progressText: isArabic ? "{{current}} من {{total}}" : "{{current}} of {{total}}",
      nextBtnText: isArabic ? "التالي ←" : "Next →",
      prevBtnText: isArabic ? "→ السابق" : "← Previous",
      doneBtnText: isArabic ? "إنهاء" : "Done",
      
      // RTL support
      overlayOpacity: 0.7,
      
      onDestroyStarted: () => {
        // Check if tour was completed (not just closed)
        const currentStep = driverObj.getActiveIndex();
        const totalSteps = driverObj.getConfig().steps?.length || 0;
        
        if (currentStep === totalSteps - 1 || currentStep === totalSteps) {
          // Tour completed
          completeOnboarding.mutate(undefined, {
            onSuccess: () => {
              utils.onboarding.getStatus.invalidate();
            },
          });
        } else {
          // Tour skipped
          skipOnboarding.mutate(undefined, {
            onSuccess: () => {
              utils.onboarding.getStatus.invalidate();
            },
          });
        }
        driverObj.destroy();
      },

      steps: isArabic ? getArabicSteps() : getEnglishSteps(),
    });

    driverObj.drive();
  };

  // Expose method to restart tour (can be called from settings)
  useEffect(() => {
    (window as any).restartOnboardingTour = startTour;
    return () => {
      delete (window as any).restartOnboardingTour;
    };
  }, [language]);

  return null; // This component doesn't render anything visible
}

/**
 * Arabic tour steps - RTL layout
 */
function getArabicSteps() {
  return [
    {
      popover: {
        title: "مرحباً بك في طبيبي My Doctor! 🏥",
        description: "دعنا نأخذك في جولة سريعة لاستكشاف المنصة الطبية الذكية. هذه الجولة ستساعدك على فهم الميزات الرئيسية وكيفية التنقل بسهولة.",
      },
    },
    {
      element: '[data-tour="symptom-checker"]',
      popover: {
        title: "فحص الأعراض الذكي 🩺",
        description: "ابدأ هنا بإدخال أعراضك. سيقوم نظام الذكاء الاصطناعي المتقدم بتحليل حالتك وتقديم تقييم أولي مع توصيات طبية مخصصة.",
        side: "bottom" as const,
        align: "start" as const,
      },
    },
    {
      element: '[data-tour="medical-history"]',
      popover: {
        title: "سجلك الطبي 📋",
        description: "هنا يمكنك الوصول إلى جميع استشاراتك السابقة، نتائج الفحوصات، والتقارير الطبية. كل معلوماتك الصحية محفوظة بشكل آمن ومنظم.",
        side: "bottom" as const,
        align: "start" as const,
      },
    },

    {
      element: '[data-tour="bio-scanner"]',
      popover: {
        title: "الماسح الحيوي 💓",
        description: "قس علاماتك الحيوية باستخدام كاميرا هاتفك فقط! يمكنك قياس معدل ضربات القلب، مستوى الإجهاد، وغيرها من المؤشرات الصحية بتقنية متقدمة.",
        side: "bottom" as const,
        align: "start" as const,
      },
    },
    {
      element: '[data-tour="language-switcher"]',
      popover: {
        title: "تبديل اللغة 🌐",
        description: "يمكنك التبديل بين العربية والإنجليزية في أي وقت. المنصة مصممة بالكامل لدعم اللغة العربية مع واجهة من اليمين إلى اليسار.",
        side: "left" as const,
        align: "start" as const,
      },
    },
    {
      element: '[data-tour="profile-menu"]',
      popover: {
        title: "قائمة الملف الشخصي ⚙️",
        description: "من هنا يمكنك إدارة حسابك، تحديث معلوماتك الطبية، تغيير الإعدادات، وإعادة تشغيل هذه الجولة في أي وقت.",
        side: "left" as const,
        align: "start" as const,
      },
    },
    {
      popover: {
        title: "جاهز للبدء! 🚀",
        description: "أنت الآن جاهز لاستخدام طبيبي My Doctor! ابدأ بفحص أعراضك أو استكشاف الميزات الأخرى. يمكنك دائماً إعادة تشغيل هذه الجولة من إعدادات الملف الشخصي.",
      },
    },
  ];
}

/**
 * English tour steps - LTR layout
 */
function getEnglishSteps() {
  return [
    {
      popover: {
        title: "Welcome to My Doctor طبيبي! 🏥",
        description: "Let's take a quick tour to explore the intelligent medical platform. This tour will help you understand the key features and how to navigate easily.",
      },
    },
    {
      element: '[data-tour="symptom-checker"]',
      popover: {
        title: "Smart Symptom Checker 🩺",
        description: "Start here by entering your symptoms. Our advanced AI system will analyze your condition and provide an initial assessment with personalized medical recommendations.",
        side: "bottom" as const,
        align: "start" as const,
      },
    },
    {
      element: '[data-tour="medical-history"]',
      popover: {
        title: "Your Medical History 📋",
        description: "Access all your previous consultations, test results, and medical reports here. All your health information is securely stored and organized.",
        side: "bottom" as const,
        align: "start" as const,
      },
    },

    {
      element: '[data-tour="bio-scanner"]',
      popover: {
        title: "Bio-Scanner 💓",
        description: "Measure your vital signs using just your phone camera! You can measure heart rate, stress levels, and other health indicators with advanced technology.",
        side: "bottom" as const,
        align: "start" as const,
      },
    },
    {
      element: '[data-tour="language-switcher"]',
      popover: {
        title: "Language Switcher 🌐",
        description: "Switch between Arabic and English anytime. The platform is fully designed to support Arabic with right-to-left interface.",
        side: "left" as const,
        align: "start" as const,
      },
    },
    {
      element: '[data-tour="profile-menu"]',
      popover: {
        title: "Profile Menu ⚙️",
        description: "From here you can manage your account, update your medical information, change settings, and restart this tour anytime.",
        side: "left" as const,
        align: "start" as const,
      },
    },
    {
      popover: {
        title: "Ready to Start! 🚀",
        description: "You're now ready to use My Doctor طبيبي! Start by checking your symptoms or exploring other features. You can always restart this tour from profile settings.",
      },
    },
  ];
}

/**
 * Hook to restart onboarding tour manually
 */
export function useRestartOnboardingTour() {
  const resetOnboarding = trpc.onboarding.resetOnboarding.useMutation();
  const utils = trpc.useUtils();

  return () => {
    resetOnboarding.mutate(undefined, {
      onSuccess: () => {
        utils.onboarding.getStatus.invalidate();
        // Trigger tour restart
        if ((window as any).restartOnboardingTour) {
          setTimeout(() => {
            (window as any).restartOnboardingTour();
          }, 500);
        }
      },
    });
  };
}
