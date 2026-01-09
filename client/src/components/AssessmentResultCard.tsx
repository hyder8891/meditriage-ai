/**
 * AssessmentResultCard - Beautiful Structured Medical Assessment Display
 * 
 * Displays AI medical assessment results in a visually appealing,
 * well-organized format with color-coded sections and clear hierarchy.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Calendar,
  Phone,
  ChevronDown,
  ChevronUp,
  Activity,
  FileText,
  Pill,
  TestTube,
  UserCheck,
  Heart,
  Shield,
  Clock,
  MapPin,
  Info
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface DifferentialDiagnosis {
  condition: string;
  probability: number;
  reasoning?: string;
  icd10?: string;
}

export interface Recommendations {
  immediateActions?: string[];
  tests?: string[];
  imaging?: string[];
  referrals?: string[];
  lifestyle?: string[];
  medications?: string[];
}

export interface AssessmentResult {
  triageLevel: "green" | "yellow" | "red";
  triageReason?: string;
  triageReasonAr?: string;
  mostLikelyCondition?: {
    condition: string;
    probability: number;
    reasoning?: string;
  } | null;
  differentialDiagnosis?: DifferentialDiagnosis[];
  recommendations?: string[];
  recommendationsAr?: string[];
  redFlags?: string[];
  structuredRecommendations?: Recommendations;
  resourceMatch?: {
    metadata: {
      name?: string;
      nameAr?: string;
      specialty?: string;
      specialtyAr?: string;
      location?: string;
      locationAr?: string;
      estimatedWaitTime?: number;
    };
    score: number;
  };
  evidence?: Array<{
    title: string;
    source: string;
    relevance?: number;
  }>;
}

interface AssessmentResultCardProps {
  result: AssessmentResult;
  onBookAppointment?: () => void;
  onCallEmergency?: () => void;
}

// ============================================================================
// Triage Configuration
// ============================================================================

const triageConfig = {
  green: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    progressColor: "bg-emerald-500",
    label: { en: "Routine Care", ar: "رعاية روتينية" },
    description: { 
      en: "Your symptoms suggest a non-urgent condition. Schedule a routine appointment.", 
      ar: "تشير أعراضك إلى حالة غير عاجلة. حدد موعداً روتينياً." 
    }
  },
  yellow: {
    icon: AlertCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    progressColor: "bg-amber-500",
    label: { en: "Urgent Care", ar: "رعاية عاجلة" },
    description: { 
      en: "Your symptoms require prompt medical attention within 24 hours.", 
      ar: "تتطلب أعراضك رعاية طبية عاجلة خلال 24 ساعة." 
    }
  },
  red: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    badgeClass: "bg-red-100 text-red-800 border-red-300",
    progressColor: "bg-red-500",
    label: { en: "Emergency", ar: "طوارئ" },
    description: { 
      en: "This appears to be a medical emergency. Seek immediate care.", 
      ar: "يبدو أن هذه حالة طوارئ طبية. اطلب الرعاية الفورية." 
    }
  }
};

// ============================================================================
// Component
// ============================================================================

export function AssessmentResultCard({ 
  result, 
  onBookAppointment,
  onCallEmergency 
}: AssessmentResultCardProps) {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [showAllDiagnoses, setShowAllDiagnoses] = useState(false);

  const config = triageConfig[result.triageLevel];
  const TriageIcon = config.icon;

  // Format confidence percentage correctly (handle both 0-1 and 0-100 ranges)
  const formatConfidence = (probability: number): number => {
    if (probability > 1) {
      // Already a percentage, but cap at 100
      return Math.min(Math.round(probability), 100);
    }
    // Convert from decimal to percentage
    return Math.round(probability * 100);
  };

  // Get confidence level label
  const getConfidenceLabel = (confidence: number): { en: string; ar: string } => {
    if (confidence >= 80) return { en: "High Confidence", ar: "ثقة عالية" };
    if (confidence >= 60) return { en: "Moderate Confidence", ar: "ثقة متوسطة" };
    if (confidence >= 40) return { en: "Low Confidence", ar: "ثقة منخفضة" };
    return { en: "Uncertain", ar: "غير مؤكد" };
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return "text-emerald-600";
    if (confidence >= 60) return "text-amber-600";
    return "text-red-600";
  };



  const handleBookAppointment = () => {
    if (onBookAppointment) {
      onBookAppointment();
    } else {
      setLocation("/patient/appointments");
    }
  };

  const handleCallEmergency = () => {
    if (onCallEmergency) {
      onCallEmergency();
    } else {
      window.location.href = "tel:122";
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-500" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Emergency Banner for Red Triage */}
      {result.triageLevel === "red" && (
        <Card className="bg-red-100 border-2 border-red-400 shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-200 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-700" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 text-lg">
                    {isArabic ? "طوارئ!" : "Emergency!"}
                  </h3>
                  <p className="text-red-700 text-sm">
                    {isArabic 
                      ? "يبدو أن هذه حالة طوارئ طبية. اطلب الرعاية الفورية."
                      : "This appears to be a medical emergency. Please seek immediate care."
                    }
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleCallEmergency}
                className="bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                <Phone className="w-4 h-4" />
                {isArabic ? "اتصل بـ 122 فوراً" : "Call 122 Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Assessment Card */}
      <Card className={cn(
        "border-2 shadow-lg overflow-hidden",
        config.borderColor
      )}>
        {/* Triage Level Header */}
        <div className={cn("px-6 py-4", config.bgColor)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-full", config.bgColor, "bg-opacity-50")}>
                <TriageIcon className={cn("w-8 h-8", config.color)} />
              </div>
              <div>
                <h2 className={cn("text-xl font-bold", config.color)}>
                  {isArabic ? config.label.ar : config.label.en}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isArabic ? config.description.ar : config.description.en}
                </p>
              </div>
            </div>
            <Badge className={cn("text-sm px-3 py-1", config.badgeClass)}>
              {result.triageLevel === "green" && (isArabic ? "🟢 أخضر" : "🟢 Green")}
              {result.triageLevel === "yellow" && (isArabic ? "🟡 أصفر" : "🟡 Yellow")}
              {result.triageLevel === "red" && (isArabic ? "🔴 أحمر" : "🔴 Red")}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Primary Diagnosis */}
          {result.mostLikelyCondition && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  {isArabic ? "التشخيص الأولي" : "Primary Diagnosis"}
                </h3>
              </div>
              
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">
                        {result.mostLikelyCondition.condition}
                      </h4>
                      {result.mostLikelyCondition.reasoning && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {result.mostLikelyCondition.reasoning}
                        </p>
                      )}
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className={cn(
                        "text-2xl font-bold",
                        getConfidenceColor(formatConfidence(result.mostLikelyCondition.probability))
                      )}>
                        {formatConfidence(result.mostLikelyCondition.probability)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {isArabic 
                          ? getConfidenceLabel(formatConfidence(result.mostLikelyCondition.probability)).ar
                          : getConfidenceLabel(formatConfidence(result.mostLikelyCondition.probability)).en
                        }
                      </div>
                      <Progress 
                        value={formatConfidence(result.mostLikelyCondition.probability)} 
                        className="h-2 mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Differential Diagnoses */}
          {result.differentialDiagnosis && result.differentialDiagnosis.length > 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">
                    {isArabic ? "التشخيصات المحتملة الأخرى" : "Other Possible Conditions"}
                  </h3>
                </div>
                {result.differentialDiagnosis.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllDiagnoses(!showAllDiagnoses)}
                    className="text-purple-600"
                  >
                    {showAllDiagnoses 
                      ? (isArabic ? "عرض أقل" : "Show Less")
                      : (isArabic ? "عرض الكل" : "Show All")
                    }
                    {showAllDiagnoses ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </Button>
                )}
              </div>
              
              <div className="grid gap-2">
                {result.differentialDiagnosis
                  .slice(1, showAllDiagnoses ? undefined : 4)
                  .map((diagnosis, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          {idx + 2}
                        </span>
                        <span className="font-medium text-gray-800">{diagnosis.condition}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={formatConfidence(diagnosis.probability)} 
                          className="w-20 h-2"
                        />
                        <span className="text-sm font-semibold text-gray-600 min-w-[45px] text-right">
                          {formatConfidence(diagnosis.probability)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Red Flags Warning */}
          {result.redFlags && result.redFlags.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-800">
                  {isArabic ? "علامات تحذيرية مهمة" : "Important Warning Signs"}
                </h3>
              </div>
              
              <Card className="bg-red-50 border border-red-200">
                <CardContent className="p-4">
                  <ul className="space-y-2">
                    {result.redFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-red-800">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recommendations */}
          {((result.recommendations && result.recommendations.length > 0) || result.structuredRecommendations) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">
                  {isArabic ? "التوصيات" : "Recommendations"}
                </h3>
              </div>
              
              {result.structuredRecommendations ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Immediate Actions */}
                  {result.structuredRecommendations.immediateActions && result.structuredRecommendations.immediateActions.length > 0 && (
                    <Card className="bg-orange-50 border border-orange-200">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {isArabic ? "إجراءات فورية" : "Immediate Actions"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <ul className="space-y-1">
                          {result.structuredRecommendations.immediateActions.map((action, idx) => (
                            <li key={idx} className="text-sm text-orange-700 flex items-start gap-2">
                              <span className="text-orange-500">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tests */}
                  {result.structuredRecommendations.tests && result.structuredRecommendations.tests.length > 0 && (
                    <Card className="bg-blue-50 border border-blue-200">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                          <TestTube className="w-4 h-4" />
                          {isArabic ? "الفحوصات الموصى بها" : "Recommended Tests"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <ul className="space-y-1">
                          {result.structuredRecommendations.tests.map((test, idx) => (
                            <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                              <span className="text-blue-500">•</span>
                              {test}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Referrals */}
                  {result.structuredRecommendations.referrals && result.structuredRecommendations.referrals.length > 0 && (
                    <Card className="bg-purple-50 border border-purple-200">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          {isArabic ? "التحويلات" : "Specialist Referrals"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <ul className="space-y-1">
                          {result.structuredRecommendations.referrals.map((ref, idx) => (
                            <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                              <span className="text-purple-500">•</span>
                              {ref}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lifestyle */}
                  {result.structuredRecommendations.lifestyle && result.structuredRecommendations.lifestyle.length > 0 && (
                    <Card className="bg-green-50 border border-green-200">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm font-semibold text-green-800 flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          {isArabic ? "نصائح نمط الحياة" : "Lifestyle Tips"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <ul className="space-y-1">
                          {result.structuredRecommendations.lifestyle.map((tip, idx) => (
                            <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                              <span className="text-green-500">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="bg-green-50 border border-green-200">
                  <CardContent className="p-4">
                    <ul className="space-y-2">
                      {(isArabic && result.recommendationsAr ? result.recommendationsAr : result.recommendations)?.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-green-800">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Healthcare Provider Match */}
          {result.resourceMatch && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-900">
                  {isArabic ? "المستشفى/العيادة الموصى بها" : "Recommended Healthcare Provider"}
                </h3>
              </div>
              
              <Card className="bg-indigo-50 border border-indigo-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-indigo-900">
                        {isArabic 
                          ? (result.resourceMatch.metadata.nameAr || result.resourceMatch.metadata.name || "مقدم الرعاية الصحية")
                          : (result.resourceMatch.metadata.name || "Healthcare Provider")
                        }
                      </h4>
                      {(result.resourceMatch.metadata.specialty || result.resourceMatch.metadata.specialtyAr) && (
                        <p className="text-sm text-indigo-700 mt-1">
                          {isArabic ? "التخصص:" : "Specialty:"} {isArabic 
                            ? (result.resourceMatch.metadata.specialtyAr || result.resourceMatch.metadata.specialty)
                            : result.resourceMatch.metadata.specialty
                          }
                        </p>
                      )}
                      {(result.resourceMatch.metadata.location || result.resourceMatch.metadata.locationAr) && (
                        <p className="text-sm text-indigo-600 mt-1">
                          {isArabic ? "الموقع:" : "Location:"} {isArabic 
                            ? (result.resourceMatch.metadata.locationAr || result.resourceMatch.metadata.location)
                            : result.resourceMatch.metadata.location
                          }
                        </p>
                      )}
                      {result.resourceMatch.metadata.estimatedWaitTime && (
                        <p className="text-sm text-indigo-600 mt-1">
                          {isArabic ? "وقت الانتظار:" : "Wait Time:"} {result.resourceMatch.metadata.estimatedWaitTime} {isArabic ? "دقيقة" : "min"}
                        </p>
                      )}
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
                      {Math.round(result.resourceMatch.score * 100)}% {isArabic ? "تطابق" : "Match"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Medical Evidence */}
          {result.evidence && result.evidence.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">
                  {isArabic ? "المراجع الطبية" : "Medical References"}
                </h3>
              </div>
              
              <div className="space-y-2">
                {result.evidence.slice(0, 3).map((ev, idx) => (
                  <div key={idx} className="text-sm text-gray-600 flex items-start gap-2 p-2 bg-gray-50 rounded">
                    <span className="text-gray-400">📚</span>
                    <span>{ev.title} ({ev.source})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Disclaimer */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600 text-center leading-relaxed">
              {isArabic 
                ? "⚕️ هذا التقييم للأغراض الإعلامية فقط ولا يحل محل الاستشارة الطبية المهنية. استشر دائماً مقدم الرعاية الصحية للحصول على التشخيص والعلاج المناسب."
                : "⚕️ This assessment is for informational purposes only and does not replace professional medical consultation. Always consult a healthcare provider for proper diagnosis and treatment."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AssessmentResultCard;
