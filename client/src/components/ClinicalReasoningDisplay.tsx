import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Activity,
  FileText,
  TrendingUp,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface DiagnosisWithConfidence {
  diagnosis: string;
  confidence: number;
  supportingEvidence: string[];
  severity: "mild" | "moderate" | "severe" | "critical";
  clinicalPresentation: string;
  nextSteps: string[];
}

interface ClinicalReasoningResult {
  differentialDiagnosis: DiagnosisWithConfidence[];
  reasoning: string;
  recommendedTests: string[];
  urgencyAssessment: string;
  redFlags: string[];
  patientEducation: string;
  followUpRecommendations: string;
}

interface Props {
  result: ClinicalReasoningResult;
  onPrint?: () => void;
  onExport?: () => void;
}

export function ClinicalReasoningDisplay({ result, onPrint, onExport }: Props) {
  const { language } = useLanguage();

  const t = {
    title: language === "ar" ? "نتائج التحليل السريري" : "Clinical Reasoning Results",
    differentialDiagnosis: language === "ar" ? "التشخيص التفريقي" : "Differential Diagnosis",
    confidence: language === "ar" ? "مستوى الثقة" : "Confidence",
    supportingEvidence: language === "ar" ? "الأدلة الداعمة" : "Supporting Evidence",
    severity: language === "ar" ? "الشدة" : "Severity",
    clinicalPresentation: language === "ar" ? "العرض السريري" : "Clinical Presentation",
    nextSteps: language === "ar" ? "الخطوات التالية" : "Next Steps",
    reasoning: language === "ar" ? "التفكير السريري" : "Clinical Reasoning",
    recommendedTests: language === "ar" ? "الفحوصات الموصى بها" : "Recommended Tests",
    urgencyAssessment: language === "ar" ? "تقييم الإلحاح" : "Urgency Assessment",
    redFlags: language === "ar" ? "علامات التحذير" : "Red Flags",
    patientEducation: language === "ar" ? "تثقيف المريض" : "Patient Education",
    followUp: language === "ar" ? "توصيات المتابعة" : "Follow-up Recommendations",
    print: language === "ar" ? "طباعة" : "Print",
    export: language === "ar" ? "تصدير" : "Export",
    mild: language === "ar" ? "خفيف" : "Mild",
    moderate: language === "ar" ? "متوسط" : "Moderate",
    severe: language === "ar" ? "شديد" : "Severe",
    critical: language === "ar" ? "حرج" : "Critical",
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "severe":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "mild":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-5 w-5" />;
      case "severe":
        return <AlertCircle className="h-5 w-5" />;
      case "moderate":
        return <AlertTriangle className="h-5 w-5" />;
      case "mild":
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
          <Activity className="h-6 w-6" />
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

      {/* Urgency Assessment */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t.urgencyAssessment}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">{result.urgencyAssessment}</p>
        </CardContent>
      </Card>

      {/* Red Flags */}
      {result.redFlags && result.redFlags.length > 0 && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-red-800">
              <AlertTriangle className="h-5 w-5" />
              {t.redFlags}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.redFlags.map((flag, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-red-900">{flag}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Differential Diagnosis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t.differentialDiagnosis}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.differentialDiagnosis.map((diagnosis, index) => (
            <div
              key={index}
              className="border-2 rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-1">{diagnosis.diagnosis}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-sm">
                      {t.confidence}: {diagnosis.confidence}%
                    </Badge>
                    <Badge
                      className={`text-sm border ${getSeverityColor(diagnosis.severity)}`}
                    >
                      <span className="mr-1">{getSeverityIcon(diagnosis.severity)}</span>
                      {t[diagnosis.severity as keyof typeof t] || diagnosis.severity}
                    </Badge>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-primary">
                    {diagnosis.confidence}%
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-1">
                    {t.clinicalPresentation}
                  </h5>
                  <p className="text-sm">{diagnosis.clinicalPresentation}</p>
                </div>

                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-1">
                    {t.supportingEvidence}
                  </h5>
                  <ul className="space-y-1">
                    {diagnosis.supportingEvidence.map((evidence, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-sm text-muted-foreground mb-1">
                    {t.nextSteps}
                  </h5>
                  <ul className="space-y-1">
                    {diagnosis.nextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Clinical Reasoning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {t.reasoning}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed whitespace-pre-wrap">{result.reasoning}</p>
        </CardContent>
      </Card>

      {/* Recommended Tests */}
      {result.recommendedTests && result.recommendedTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {t.recommendedTests}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.recommendedTests.map((test, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="flex-1">{test}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Patient Education */}
      {result.patientEducation && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <BookOpen className="h-5 w-5" />
              {t.patientEducation}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-900 leading-relaxed">{result.patientEducation}</p>
          </CardContent>
        </Card>
      )}

      {/* Follow-up Recommendations */}
      {result.followUpRecommendations && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Calendar className="h-5 w-5" />
              {t.followUp}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-900 leading-relaxed">{result.followUpRecommendations}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
