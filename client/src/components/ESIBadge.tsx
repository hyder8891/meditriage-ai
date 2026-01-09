/**
 * ESIBadge - Emergency Severity Index Visualization Component
 * 
 * Displays ESI levels with color-coded badges:
 * - Level 1-2: Red (Immediate/Emergent - life-threatening)
 * - Level 3: Yellow/Orange (Urgent - needs prompt care)
 * - Level 4-5: Green (Less Urgent/Non-Urgent)
 * 
 * Based on the Emergency Severity Index (ESI) triage algorithm
 */

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, AlertCircle, CheckCircle2, Info, Ambulance, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export type ESILevel = 1 | 2 | 3 | 4 | 5;

interface ESIBadgeProps {
  level: ESILevel;
  showLabel?: boolean;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// ESI Level Configuration
const esiConfig: Record<ESILevel, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
  label: { en: string; ar: string };
  shortLabel: { en: string; ar: string };
  description: { en: string; ar: string };
  timeframe: { en: string; ar: string };
  examples: { en: string[]; ar: string[] };
}> = {
  1: {
    icon: Ambulance,
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-400",
    badgeClass: "bg-red-600 text-white hover:bg-red-700 border-red-700",
    label: { en: "ESI Level 1 - Resuscitation", ar: "مستوى ESI 1 - إنعاش" },
    shortLabel: { en: "ESI-1", ar: "ESI-1" },
    description: { 
      en: "Immediate life-saving intervention required. Patient requires immediate physician evaluation.", 
      ar: "يتطلب تدخلاً فورياً لإنقاذ الحياة. يحتاج المريض إلى تقييم طبي فوري." 
    },
    timeframe: { en: "Immediate", ar: "فوري" },
    examples: { 
      en: ["Cardiac arrest", "Severe respiratory distress", "Major trauma", "Unresponsive"],
      ar: ["توقف القلب", "ضيق تنفس حاد", "إصابة كبرى", "عدم استجابة"]
    }
  },
  2: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    badgeClass: "bg-red-500 text-white hover:bg-red-600 border-red-600",
    label: { en: "ESI Level 2 - Emergent", ar: "مستوى ESI 2 - طارئ" },
    shortLabel: { en: "ESI-2", ar: "ESI-2" },
    description: { 
      en: "High-risk situation or severe pain/distress. Should not wait to be seen.", 
      ar: "حالة عالية الخطورة أو ألم/ضيق شديد. لا ينبغي الانتظار للفحص." 
    },
    timeframe: { en: "Within 10 minutes", ar: "خلال 10 دقائق" },
    examples: { 
      en: ["Chest pain", "Stroke symptoms", "Severe allergic reaction", "High-risk pregnancy"],
      ar: ["ألم في الصدر", "أعراض سكتة دماغية", "رد فعل تحسسي شديد", "حمل عالي الخطورة"]
    }
  },
  3: {
    icon: AlertCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    badgeClass: "bg-amber-500 text-white hover:bg-amber-600 border-amber-600",
    label: { en: "ESI Level 3 - Urgent", ar: "مستوى ESI 3 - عاجل" },
    shortLabel: { en: "ESI-3", ar: "ESI-3" },
    description: { 
      en: "Urgent condition requiring multiple resources. Stable but needs prompt attention.", 
      ar: "حالة عاجلة تتطلب موارد متعددة. مستقر ولكن يحتاج اهتماماً سريعاً." 
    },
    timeframe: { en: "Within 30-60 minutes", ar: "خلال 30-60 دقيقة" },
    examples: { 
      en: ["Abdominal pain", "High fever", "Moderate asthma", "Fractures"],
      ar: ["ألم في البطن", "حمى شديدة", "ربو متوسط", "كسور"]
    }
  },
  4: {
    icon: Clock,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    badgeClass: "bg-green-500 text-white hover:bg-green-600 border-green-600",
    label: { en: "ESI Level 4 - Less Urgent", ar: "مستوى ESI 4 - أقل إلحاحاً" },
    shortLabel: { en: "ESI-4", ar: "ESI-4" },
    description: { 
      en: "Less urgent condition requiring one resource. Can wait safely.", 
      ar: "حالة أقل إلحاحاً تتطلب مورداً واحداً. يمكن الانتظار بأمان." 
    },
    timeframe: { en: "Within 1-2 hours", ar: "خلال 1-2 ساعة" },
    examples: { 
      en: ["Minor laceration", "Urinary symptoms", "Mild rash", "Earache"],
      ar: ["جرح بسيط", "أعراض بولية", "طفح جلدي خفيف", "ألم في الأذن"]
    }
  },
  5: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    badgeClass: "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600",
    label: { en: "ESI Level 5 - Non-Urgent", ar: "مستوى ESI 5 - غير عاجل" },
    shortLabel: { en: "ESI-5", ar: "ESI-5" },
    description: { 
      en: "Non-urgent condition requiring no resources. Could be seen in primary care.", 
      ar: "حالة غير عاجلة لا تتطلب موارد. يمكن فحصها في الرعاية الأولية." 
    },
    timeframe: { en: "Within 2-24 hours", ar: "خلال 2-24 ساعة" },
    examples: { 
      en: ["Prescription refill", "Minor cold symptoms", "Medication questions", "Follow-up visit"],
      ar: ["تجديد وصفة طبية", "أعراض برد خفيفة", "أسئلة عن الأدوية", "زيارة متابعة"]
    }
  }
};

// Size configurations
const sizeConfig = {
  sm: {
    badge: "text-xs px-2 py-0.5",
    icon: "w-3 h-3",
    container: "gap-1"
  },
  md: {
    badge: "text-sm px-3 py-1",
    icon: "w-4 h-4",
    container: "gap-1.5"
  },
  lg: {
    badge: "text-base px-4 py-1.5",
    icon: "w-5 h-5",
    container: "gap-2"
  }
};

export function ESIBadge({ 
  level, 
  showLabel = true, 
  showTooltip = true,
  size = "md",
  className 
}: ESIBadgeProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const config = esiConfig[level];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  const badgeContent = (
    <Badge 
      className={cn(
        "font-semibold border-2 cursor-default transition-all",
        config.badgeClass,
        sizeStyles.badge,
        className
      )}
    >
      <span className={cn("flex items-center", sizeStyles.container)}>
        <Icon className={sizeStyles.icon} />
        {showLabel && (
          <span>{isArabic ? config.shortLabel.ar : config.shortLabel.en}</span>
        )}
      </span>
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs p-4 bg-white border shadow-lg"
          sideOffset={5}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={cn("w-5 h-5", config.color)} />
              <span className="font-bold text-gray-900">
                {isArabic ? config.label.ar : config.label.en}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {isArabic ? config.description.ar : config.description.en}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">
                {isArabic ? "الوقت المتوقع:" : "Expected wait:"}{" "}
                <span className="font-medium text-gray-700">
                  {isArabic ? config.timeframe.ar : config.timeframe.en}
                </span>
              </span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-1">
                {isArabic ? "أمثلة:" : "Examples:"}
              </p>
              <div className="flex flex-wrap gap-1">
                {(isArabic ? config.examples.ar : config.examples.en).slice(0, 3).map((example, idx) => (
                  <span 
                    key={idx} 
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      config.bgColor,
                      config.color
                    )}
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper function to convert triage level to ESI level
export function triageLevelToESI(triageLevel: "green" | "yellow" | "red"): ESILevel {
  switch (triageLevel) {
    case "red": return 2; // Emergent
    case "yellow": return 3; // Urgent
    case "green": return 5; // Non-urgent
    default: return 4;
  }
}

// Helper function to convert severity to ESI level
export function severityToESI(severity: "low" | "moderate" | "high" | "critical"): ESILevel {
  switch (severity) {
    case "critical": return 1;
    case "high": return 2;
    case "moderate": return 3;
    case "low": return 5;
    default: return 4;
  }
}

// ESI Level Display Card for detailed view
interface ESILevelCardProps {
  level: ESILevel;
  className?: string;
}

export function ESILevelCard({ level, className }: ESILevelCardProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const config = esiConfig[level];
  const Icon = config.icon;

  return (
    <div className={cn(
      "rounded-lg border-2 p-4",
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-full",
          config.bgColor,
          "bg-opacity-50"
        )}>
          <Icon className={cn("w-6 h-6", config.color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className={cn("font-bold text-lg", config.color)}>
              {isArabic ? config.label.ar : config.label.en}
            </h3>
            <ESIBadge level={level} showTooltip={false} size="lg" />
          </div>
          <p className="text-sm text-gray-700 mb-3">
            {isArabic ? config.description.ar : config.description.en}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {isArabic ? config.timeframe.ar : config.timeframe.en}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ESIBadge;
