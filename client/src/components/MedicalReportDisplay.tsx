/**
 * Enhanced Medical Report Display Component
 * Provides structured, collapsible sections with better visual hierarchy
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  Heart,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
  TrendingUp,
  Info,
} from "lucide-react";

interface Finding {
  finding: string;
  severity: "normal" | "abnormal" | "critical";
  category: string;
  location?: string;
  value?: string;
  referenceRange?: string;
}

interface Diagnosis {
  primary: string;
  confidence: number;
  differential: string[];
}

interface Recommendations {
  immediate: string[];
  followUp: string[];
  lifestyle: string[];
}

interface TechnicalQuality {
  completeness: string;
  readability: string;
  notes: string;
}

interface MedicalReportData {
  reportType: string;
  urgency: "routine" | "semi-urgent" | "urgent" | "emergency";
  summary: string;
  criticalFlags?: string[];
  findings: Finding[];
  diagnosis: Diagnosis;
  recommendations: Recommendations;
  technicalQuality: TechnicalQuality;
}

interface MedicalReportDisplayProps {
  data: MedicalReportData;
  reportTypeName: string;
  onAnalyzeAnother: () => void;
  language?: 'ar' | 'en';
}

const TRANSLATIONS = {
  ar: {
    analyzeAnother: 'تحليل تقرير آخر',
    criticalFindings: '⚠️ نتائج حرجة تم اكتشافها',
    executiveSummary: 'الملخص التنفيذي',
    clinicalFindings: 'النتائج السريرية',
    findingsIdentified: 'نتيجة محددة',
    diagnosticImpression: 'الانطباع التشخيصي',
    primaryDiagnosis: 'التشخيص الأساسي',
    confidence: 'الثقة',
    differentialDiagnoses: 'التشخيصات التفاضلية',
    clinicalRecommendations: 'التوصيات السريرية',
    immediateActions: 'إجراءات فورية',
    followUp: 'المتابعة',
    lifestyle: 'نمط الحياة',
    noImmediateActions: 'لا توجد إجراءات فورية مطلوبة',
    noFollowUp: 'لا توجد متابعة مطلوبة',
    noLifestyleChanges: 'لا توجد تغييرات في نمط الحياة مقترحة',
    reportQuality: 'تقييم جودة التقرير',
    completeness: 'الاكتمال',
    readability: 'سهولة القراءة',
    qualityNotes: 'ملاحظات الجودة',
    urgency: {
      emergency: 'طارئ',
      urgent: 'عاجل',
      semiUrgent: 'شبه عاجل',
      routine: 'روتيني',
    },
    severity: {
      critical: 'حرج',
      abnormal: 'غير طبيعي',
      normal: 'طبيعي',
    },
  },
  en: {
    analyzeAnother: 'Analyze Another Report',
    criticalFindings: '⚠️ Critical Findings Detected',
    executiveSummary: 'Executive Summary',
    clinicalFindings: 'Clinical Findings',
    findingsIdentified: 'finding(s) identified',
    diagnosticImpression: 'Diagnostic Impression',
    primaryDiagnosis: 'PRIMARY DIAGNOSIS',
    confidence: 'Confidence',
    differentialDiagnoses: 'DIFFERENTIAL DIAGNOSES',
    clinicalRecommendations: 'Clinical Recommendations',
    immediateActions: 'Immediate Actions',
    followUp: 'Follow-up',
    lifestyle: 'Lifestyle',
    noImmediateActions: 'No immediate actions required',
    noFollowUp: 'No follow-up required',
    noLifestyleChanges: 'No lifestyle changes suggested',
    reportQuality: 'Report Quality Assessment',
    completeness: 'Completeness',
    readability: 'Readability',
    qualityNotes: 'Quality Notes',
    urgency: {
      emergency: 'EMERGENCY',
      urgent: 'URGENT',
      semiUrgent: 'SEMI-URGENT',
      routine: 'ROUTINE',
    },
    severity: {
      critical: 'CRITICAL',
      abnormal: 'ABNORMAL',
      normal: 'NORMAL',
    },
  },
};

export function MedicalReportDisplay({
  data,
  reportTypeName,
  onAnalyzeAnother,
  language = 'en',
}: MedicalReportDisplayProps) {
  const t = TRANSLATIONS[language];
  const isRTL = language === 'ar';
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    summary: true,
    findings: true,
    diagnosis: true,
    recommendations: true,
    quality: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return { variant: "destructive" as const, color: "bg-red-500", label: t.urgency.emergency };
      case "urgent":
        return { variant: "destructive" as const, color: "bg-orange-500", label: t.urgency.urgent };
      case "semi-urgent":
        return { variant: "default" as const, color: "bg-yellow-500", label: t.urgency.semiUrgent };
      default:
        return { variant: "secondary" as const, color: "bg-green-500", label: t.urgency.routine };
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: "text-red-600 bg-red-50 border-red-200",
          badge: "destructive" as const,
        };
      case "abnormal":
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          color: "text-yellow-600 bg-yellow-50 border-yellow-200",
          badge: "default" as const,
        };
      default:
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          color: "text-green-600 bg-green-50 border-green-200",
          badge: "secondary" as const,
        };
    }
  };

  const urgencyConfig = getUrgencyConfig(data.urgency);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Badge variant={urgencyConfig.variant} className="text-sm px-4 py-1">
            {urgencyConfig.label}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{reportTypeName}</span>
          </div>
        </div>
        <Button variant="outline" onClick={onAnalyzeAnother}>
          {t.analyzeAnother}
        </Button>
      </div>

      {/* Critical Flags Alert */}
      {data.criticalFlags && data.criticalFlags.length > 0 && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">{t.criticalFindings}</AlertTitle>
          <AlertDescription>
            <div className="mt-3 space-y-2">
              {data.criticalFlags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                  <span className="text-red-600 font-bold">•</span>
                  <span className="font-medium">{flag}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Section - Collapsible */}
      <Collapsible open={openSections.summary} onOpenChange={() => toggleSection("summary")}>
        <Card className="border-2">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{t.executiveSummary}</CardTitle>
                </div>
                {openSections.summary ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <p className="text-base leading-relaxed">{data.summary}</p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Findings Section - Collapsible */}
      <Collapsible open={openSections.findings} onOpenChange={() => toggleSection("findings")}>
        <Card className="border-2">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-xl">{t.clinicalFindings}</CardTitle>
                    <CardDescription>{data.findings.length} {t.findingsIdentified}</CardDescription>
                  </div>
                </div>
                {openSections.findings ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-3">
                {data.findings.map((finding, idx) => {
                  const severityConfig = getSeverityConfig(finding.severity);
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 ${severityConfig.color}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{severityConfig.icon}</div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={severityConfig.badge} className="font-semibold">
                              {finding.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{finding.category}</Badge>
                            {finding.location && (
                              <Badge variant="secondary" className="text-xs">
                                📍 {finding.location}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">{finding.finding}</p>
                          {finding.value && finding.referenceRange && (
                            <div className="text-xs bg-white/50 p-2 rounded">
                              <span className="font-semibold">Value:</span> {finding.value} •{" "}
                              <span className="font-semibold">Reference:</span> {finding.referenceRange}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Diagnosis Section - Collapsible */}
      <Collapsible open={openSections.diagnosis} onOpenChange={() => toggleSection("diagnosis")}>
        <Card className="border-2">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">{t.diagnosticImpression}</CardTitle>
                </div>
                {openSections.diagnosis ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-green-700">{t.primaryDiagnosis}</span>
                  <Badge variant="secondary" className="bg-green-600 text-white">
                    {data.diagnosis.confidence}% {t.confidence}
                  </Badge>
                </div>
                <p className="text-base font-medium">{data.diagnosis.primary}</p>
              </div>

              {data.diagnosis.differential.length > 0 && (
                <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {t.differentialDiagnoses}
                  </h4>
                  <ul className="space-y-2">
                    {data.diagnosis.differential.map((diff, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500 font-bold">{idx + 1}.</span>
                        <span>{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Recommendations Section - Collapsible */}
      <Collapsible
        open={openSections.recommendations}
        onOpenChange={() => toggleSection("recommendations")}
      >
        <Card className="border-2">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Heart className="h-5 w-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">{t.clinicalRecommendations}</CardTitle>
                </div>
                {openSections.recommendations ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Immediate Actions */}
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold text-red-700">{t.immediateActions}</h4>
                  </div>
                  {data.recommendations.immediate.length > 0 ? (
                    <ul className="space-y-2">
                      {data.recommendations.immediate.map((rec, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-red-600 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.noImmediateActions}</p>
                  )}
                </div>

                {/* Follow-up */}
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-700">{t.followUp}</h4>
                  </div>
                  {data.recommendations.followUp.length > 0 ? (
                    <ul className="space-y-2">
                      {data.recommendations.followUp.map((rec, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.noFollowUp}</p>
                  )}
                </div>

                {/* Lifestyle */}
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-700">{t.lifestyle}</h4>
                  </div>
                  {data.recommendations.lifestyle.length > 0 ? (
                    <ul className="space-y-2">
                      {data.recommendations.lifestyle.map((rec, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.noLifestyleChanges}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Quality Assessment Section - Collapsible */}
      <Collapsible open={openSections.quality} onOpenChange={() => toggleSection("quality")}>
        <Card className="border-2">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <CardTitle className="text-xl">{t.reportQuality}</CardTitle>
                </div>
                {openSections.quality ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">{t.completeness}</span>
                  <Badge variant="outline" className="mt-2 block w-fit">
                    {data.technicalQuality.completeness}
                  </Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">{t.readability}</span>
                  <Badge variant="outline" className="mt-2 block w-fit">
                    {data.technicalQuality.readability}
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">{t.qualityNotes}</span>
                <p className="mt-2 text-sm text-muted-foreground">
                  {data.technicalQuality.notes}
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
