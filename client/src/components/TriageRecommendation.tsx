import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Clock,
  Stethoscope,
  Heart,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  Printer,
  Download,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Recommendations {
  urgencyLevel: "emergency" | "urgent" | "routine" | "self-care";
  urgencyDescription: string;
  possibleConditions?: string[];
  recommendedActions?: string[];
  specialistReferral?: string;
  redFlagSymptoms?: string[];
  selfCareInstructions?: string[];
  timelineForCare: string;
  emergencyWarning?: string;
}

interface TriageRecommendationProps {
  recommendations: Recommendations;
  onPrint?: () => void;
  onExport?: () => void;
}

export function TriageRecommendation({
  recommendations,
  onPrint,
  onExport,
}: TriageRecommendationProps) {
  const { language } = useLanguage();

  const t = {
    finalAssessment: language === "ar" ? "التقييم النهائي" : "Final Assessment",
    urgencyLevel: language === "ar" ? "مستوى الإلحاح" : "Urgency Level",
    possibleConditions: language === "ar" ? "الحالات المحتملة" : "Possible Conditions",
    recommendedActions: language === "ar" ? "الإجراءات الموصى بها" : "Recommended Actions",
    specialistReferral: language === "ar" ? "إحالة إلى أخصائي" : "Specialist Referral",
    redFlagSymptoms: language === "ar" ? "أعراض تحذيرية" : "Red Flag Symptoms",
    selfCare: language === "ar" ? "العناية الذاتية" : "Self-Care Instructions",
    timeline: language === "ar" ? "الإطار الزمني" : "Timeline for Care",
    emergency: language === "ar" ? "طوارئ" : "Emergency",
    urgent: language === "ar" ? "عاجل" : "Urgent",
    routine: language === "ar" ? "روتيني" : "Routine",
    selfCareLevel: language === "ar" ? "عناية ذاتية" : "Self-Care",
    emergencyCall: language === "ar" ? "اتصل بـ 122 فوراً" : "Call 122 Immediately",
    findNearby: language === "ar" ? "ابحث عن مرافق قريبة" : "Find Nearby Facilities",
    print: language === "ar" ? "طباعة" : "Print",
    export: language === "ar" ? "تصدير" : "Export",
    disclaimer: language === "ar"
      ? "هذا التقييم للأغراض الإعلامية فقط ولا يحل محل الاستشارة الطبية المهنية."
      : "This assessment is for informational purposes only and does not replace professional medical consultation.",
  };

  const urgencyConfig = {
    emergency: {
      color: "bg-red-100 text-red-800 border-red-300",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      label: t.emergency,
    },
    urgent: {
      color: "bg-orange-100 text-orange-800 border-orange-300",
      icon: AlertCircle,
      iconColor: "text-orange-600",
      label: t.urgent,
    },
    routine: {
      color: "bg-blue-100 text-blue-800 border-blue-300",
      icon: Clock,
      iconColor: "text-blue-600",
      label: t.routine,
    },
    "self-care": {
      color: "bg-green-100 text-green-800 border-green-300",
      icon: CheckCircle2,
      iconColor: "text-green-600",
      label: t.selfCareLevel,
    },
  };

  // Map backend urgency levels to frontend config keys
  const urgencyMapping: Record<string, keyof typeof urgencyConfig> = {
    'EMERGENCY': 'emergency',
    'emergency': 'emergency',
    'URGENT': 'urgent',
    'urgent': 'urgent',
    'SEMI-URGENT': 'urgent',
    'NON-URGENT': 'routine',
    'ROUTINE': 'routine',
    'routine': 'routine',
    'SELF-CARE': 'self-care',
    'self-care': 'self-care',
  };

  const mappedUrgency = urgencyMapping[recommendations.urgencyLevel] || 'routine';
  const config = urgencyConfig[mappedUrgency];
  const UrgencyIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Emergency Warning Banner */}
      {recommendations.emergencyWarning && (
        <Card className="border-4 border-red-500 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-12 w-12 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-900 mb-2">
                  {t.emergency}!
                </h3>
                <p className="text-red-800 mb-4">{recommendations.emergencyWarning}</p>
                <Button
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => window.open("tel:122")}
                >
                  <Phone className="mr-2 h-5 w-5" />
                  {t.emergencyCall}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Assessment Card */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              {t.finalAssessment}
            </CardTitle>
            <div className="flex gap-2">
              {onPrint && (
                <Button variant="outline" size="sm" onClick={onPrint}>
                  <Printer className="h-4 w-4 mr-1" />
                  {t.print}
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4 mr-1" />
                  {t.export}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Urgency Level */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              {t.urgencyLevel}
            </h3>
            <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${config.color}`}>
              <UrgencyIcon className={`h-8 w-8 ${config.iconColor}`} />
              <div className="flex-1">
                <div className="font-bold text-lg">{config.label}</div>
                <p className="text-sm mt-1">{recommendations.urgencyDescription}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t.timeline}
            </h3>
            <p className="text-base font-medium">{recommendations.timelineForCare}</p>
          </div>

          {/* Possible Conditions */}
          {recommendations.possibleConditions && recommendations.possibleConditions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {t.possibleConditions}
              </h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.possibleConditions.map((condition, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm py-1 px-3">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Red Flag Symptoms */}
          {recommendations.redFlagSymptoms && Array.isArray(recommendations.redFlagSymptoms) && recommendations.redFlagSymptoms.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t.redFlagSymptoms}
              </h3>
              <ul className="space-y-1">
                {recommendations.redFlagSymptoms.map((symptom, idx) => (
                  <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions */}
          {recommendations.recommendedActions && recommendations.recommendedActions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {t.recommendedActions}
              </h3>
              <div className="space-y-2">
                {recommendations.recommendedActions.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <p className="text-sm flex-1">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specialist Referral */}
          {recommendations.specialistReferral && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                {t.specialistReferral}
              </h3>
              <p className="text-sm text-purple-800 mb-3">
                {recommendations.specialistReferral}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-300 hover:bg-purple-100"
                onClick={() => window.location.href = "/care-locator"}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {t.findNearby}
              </Button>
            </div>
          )}

          {/* Self-Care Instructions */}
          {recommendations.selfCareInstructions && Array.isArray(recommendations.selfCareInstructions) && recommendations.selfCareInstructions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {t.selfCare}
              </h3>
              <ul className="space-y-2">
                {recommendations.selfCareInstructions.map((instruction, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground italic">
              {t.disclaimer}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
