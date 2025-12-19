import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Pill,
  FileText,
  DollarSign,
  MapPin,
  Printer,
  Download,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MonitoringParameter {
  parameter: string;
  frequency: string;
  targetRange: string;
}

interface DrugInteraction {
  drugs: string[];
  severity: "contraindicated" | "major" | "moderate" | "minor";
  severityScore?: number;
  mechanism: string;
  clinicalSignificance: string;
  timeToOnset?: string;
  management: string;
  alternatives?: string[];
  timing?: string;
  dosageAdjustment?: string;
  monitoringParameters?: MonitoringParameter[];
  patientCounseling?: string;
  references?: string[];
}

interface FoodInteraction {
  food: string;
  interaction: string;
  recommendation: string;
}

interface DrugInteractionResult {
  interactions: DrugInteraction[];
  overallRisk: "high" | "moderate" | "low";
  overallRiskScore?: number;
  recommendations: string[];
  monitoring: string[];
  foodInteractions?: FoodInteraction[];
  costEffectiveness?: string;
  availabilityNotes?: string;
}

interface Props {
  result: DrugInteractionResult;
  onPrint?: () => void;
  onExport?: () => void;
}

export function DrugInteractionDisplay({ result, onPrint, onExport }: Props) {
  const { language } = useLanguage();

  const t = {
    title: language === "ar" ? "نتائج فحص التفاعلات الدوائية" : "Drug Interaction Analysis",
    overallRisk: language === "ar" ? "التقييم العام للمخاطر" : "Overall Risk Assessment",
    interactions: language === "ar" ? "التفاعلات المكتشفة" : "Detected Interactions",
    severity: language === "ar" ? "الشدة" : "Severity",
    mechanism: language === "ar" ? "آلية التفاعل" : "Mechanism",
    clinicalSignificance: language === "ar" ? "الأهمية السريرية" : "Clinical Significance",
    timeToOnset: language === "ar" ? "وقت البداية" : "Time to Onset",
    management: language === "ar" ? "الإدارة" : "Management",
    alternatives: language === "ar" ? "البدائل الدوائية" : "Alternative Medications",
    dosageAdjustment: language === "ar" ? "تعديل الجرعة" : "Dosage Adjustment",
    monitoring: language === "ar" ? "المراقبة المطلوبة" : "Monitoring Required",
    patientCounseling: language === "ar" ? "نصائح للمريض" : "Patient Counseling",
    foodInteractions: language === "ar" ? "تفاعلات الطعام" : "Food Interactions",
    recommendations: language === "ar" ? "التوصيات" : "Recommendations",
    costEffectiveness: language === "ar" ? "التكلفة والفعالية" : "Cost Effectiveness",
    availability: language === "ar" ? "التوفر في العراق" : "Availability in Iraq",
    print: language === "ar" ? "طباعة" : "Print",
    export: language === "ar" ? "تصدير" : "Export",
    high: language === "ar" ? "عالي" : "High",
    moderate: language === "ar" ? "متوسط" : "Moderate",
    low: language === "ar" ? "منخفض" : "Low",
    contraindicated: language === "ar" ? "محظور" : "Contraindicated",
    major: language === "ar" ? "رئيسي" : "Major",
    minor: language === "ar" ? "بسيط" : "Minor",
    immediate: language === "ar" ? "فوري" : "Immediate",
    hours: language === "ar" ? "ساعات" : "Hours",
    days: language === "ar" ? "أيام" : "Days",
    weeks: language === "ar" ? "أسابيع" : "Weeks",
    parameter: language === "ar" ? "المعامل" : "Parameter",
    frequency: language === "ar" ? "التكرار" : "Frequency",
    targetRange: language === "ar" ? "المدى المستهدف" : "Target Range",
    references: language === "ar" ? "المراجع" : "References",
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "moderate":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "contraindicated":
        return "bg-red-100 text-red-800 border-red-300";
      case "major":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "minor":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "contraindicated":
        return <XCircle className="h-5 w-5" />;
      case "major":
        return <AlertCircle className="h-5 w-5" />;
      case "moderate":
        return <AlertTriangle className="h-5 w-5" />;
      case "minor":
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Pill className="h-6 w-6" />
          {t.title}
        </h2>
        <div className="flex gap-2">
          {onPrint && (
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              {t.print}
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              {t.export}
            </Button>
          )}
        </div>
      </div>

      {/* Overall Risk Assessment */}
      <Card className={`border-2 ${getRiskColor(result.overallRisk)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            {t.overallRisk}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Badge className={`text-lg px-4 py-2 ${getRiskColor(result.overallRisk)}`}>
                {t[result.overallRisk as keyof typeof t]} {t.severity}
              </Badge>
            </div>
            {result.overallRiskScore !== undefined && (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {result.overallRiskScore}/10
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interactions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          {t.interactions}
        </h3>
        {result.interactions.map((interaction, index) => (
          <Card key={index} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">
                    {interaction.drugs.join(" + ")}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`border ${getSeverityColor(interaction.severity)}`}>
                      <span className="mr-1">{getSeverityIcon(interaction.severity)}</span>
                      {t[interaction.severity as keyof typeof t]}
                    </Badge>
                    {interaction.severityScore !== undefined && (
                      <Badge variant="secondary">
                        {t.severity}: {interaction.severityScore}/10
                      </Badge>
                    )}
                    {interaction.timeToOnset && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t[interaction.timeToOnset as keyof typeof t] || interaction.timeToOnset}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h5 className="font-medium text-sm text-muted-foreground mb-1">
                  {t.mechanism}
                </h5>
                <p className="text-sm">{interaction.mechanism}</p>
              </div>

              <div>
                <h5 className="font-medium text-sm text-muted-foreground mb-1">
                  {t.clinicalSignificance}
                </h5>
                <p className="text-sm">{interaction.clinicalSignificance}</p>
              </div>

              <div>
                <h5 className="font-medium text-sm text-muted-foreground mb-1">
                  {t.management}
                </h5>
                <p className="text-sm">{interaction.management}</p>
              </div>

              {interaction.dosageAdjustment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h5 className="font-medium text-sm text-blue-900 mb-1">
                    {t.dosageAdjustment}
                  </h5>
                  <p className="text-sm text-blue-800">{interaction.dosageAdjustment}</p>
                </div>
              )}

              {interaction.alternatives && interaction.alternatives.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-2">
                    {t.alternatives}
                  </h5>
                  <ul className="space-y-1">
                    {interaction.alternatives.map((alt, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Pill className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{alt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {interaction.monitoringParameters && interaction.monitoringParameters.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-2">
                    {t.monitoring}
                  </h5>
                  <div className="space-y-2">
                    {interaction.monitoringParameters.map((param, idx) => (
                      <div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-purple-900">{t.parameter}:</span>
                            <p className="text-purple-800">{param.parameter}</p>
                          </div>
                          <div>
                            <span className="font-medium text-purple-900">{t.frequency}:</span>
                            <p className="text-purple-800">{param.frequency}</p>
                          </div>
                          <div>
                            <span className="font-medium text-purple-900">{t.targetRange}:</span>
                            <p className="text-purple-800">{param.targetRange}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {interaction.patientCounseling && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <h5 className="font-medium text-sm text-amber-900 mb-1">
                    {t.patientCounseling}
                  </h5>
                  <p className="text-sm text-amber-800">{interaction.patientCounseling}</p>
                </div>
              )}

              {interaction.references && interaction.references.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-1">
                    {t.references}
                  </h5>
                  <ul className="space-y-1">
                    {interaction.references.map((ref, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <FileText className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span>{ref}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Food Interactions */}
      {result.foodInteractions && result.foodInteractions.length > 0 && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              {t.foodInteractions}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.foodInteractions.map((food, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-orange-200">
                <h5 className="font-semibold text-orange-900 mb-1">{food.food}</h5>
                <p className="text-sm text-orange-800 mb-2">{food.interaction}</p>
                <p className="text-sm font-medium text-orange-900">
                  ✓ {food.recommendation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {t.recommendations}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="flex-1">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Cost Effectiveness */}
      {result.costEffectiveness && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <DollarSign className="h-5 w-5" />
              {t.costEffectiveness}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-900 leading-relaxed">{result.costEffectiveness}</p>
          </CardContent>
        </Card>
      )}

      {/* Availability Notes */}
      {result.availabilityNotes && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <MapPin className="h-5 w-5" />
              {t.availability}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-900 leading-relaxed">{result.availabilityNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
