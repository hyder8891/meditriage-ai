/**
 * Medical Reports Analysis Page
 * AI-powered analysis for various medical reports and diagnostic tests
 * Design pattern matches MedicalImagingAnalysis.tsx
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Streamdown } from "streamdown";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  AlertTriangle,
  Loader2,
  FileCheck,
  Microscope,
  Droplet,
  FileBarChart,
  Stethoscope,
  Heart,
  Wind,
  Pill,
  Dna,
  Bug,
  TestTube,
  Beaker,
} from "lucide-react";

type ReportType =
  | "pathology"
  | "blood_test"
  | "discharge_summary"
  | "consultation_note"
  | "ecg"
  | "pulmonary_function"
  | "endoscopy"
  | "colonoscopy"
  | "cardiac_stress"
  | "sleep_study"
  | "genetic_test"
  | "microbiology"
  | "allergy_test"
  | "urinalysis"
  | "other";

interface ReportTypeOption {
  value: ReportType;
  label: string;
  labelAr: string;
  icon: any;
  description: string;
}

const REPORT_TYPES: ReportTypeOption[] = [
  {
    value: "pathology",
    label: "Pathology Report",
    labelAr: "تقرير علم الأمراض",
    icon: Microscope,
    description: "Biopsy, cytology, histopathology",
  },
  {
    value: "blood_test",
    label: "Blood Test Report",
    labelAr: "تقرير فحص الدم",
    icon: Droplet,
    description: "CBC, metabolic panel, lipid panel",
  },
  {
    value: "discharge_summary",
    label: "Discharge Summary",
    labelAr: "ملخص الخروج",
    icon: FileBarChart,
    description: "Hospital discharge documentation",
  },
  {
    value: "consultation_note",
    label: "Consultation Note",
    labelAr: "ملاحظة استشارة",
    icon: Stethoscope,
    description: "Specialist consultation report",
  },
  {
    value: "ecg",
    label: "ECG/EKG Report",
    labelAr: "تقرير تخطيط القلب",
    icon: Heart,
    description: "Electrocardiogram results",
  },
  {
    value: "pulmonary_function",
    label: "Pulmonary Function Test",
    labelAr: "اختبار وظائف الرئة",
    icon: Wind,
    description: "Spirometry, lung capacity",
  },
  {
    value: "endoscopy",
    label: "Endoscopy Report",
    labelAr: "تقرير المنظار",
    icon: Activity,
    description: "Upper GI endoscopy findings",
  },
  {
    value: "colonoscopy",
    label: "Colonoscopy Report",
    labelAr: "تقرير تنظير القولون",
    icon: Activity,
    description: "Colon examination findings",
  },
  {
    value: "cardiac_stress",
    label: "Cardiac Stress Test",
    labelAr: "اختبار إجهاد القلب",
    icon: Heart,
    description: "Exercise or pharmacological stress test",
  },
  {
    value: "sleep_study",
    label: "Sleep Study Report",
    labelAr: "تقرير دراسة النوم",
    icon: Clock,
    description: "Polysomnography results",
  },
  {
    value: "genetic_test",
    label: "Genetic Test Report",
    labelAr: "تقرير الاختبار الجيني",
    icon: Dna,
    description: "Genetic screening, variants",
  },
  {
    value: "microbiology",
    label: "Microbiology/Culture Report",
    labelAr: "تقرير المزرعة الميكروبية",
    icon: Bug,
    description: "Bacterial culture, sensitivity",
  },
  {
    value: "allergy_test",
    label: "Allergy Test Report",
    labelAr: "تقرير اختبار الحساسية",
    icon: TestTube,
    description: "Skin prick, IgE testing",
  },
  {
    value: "urinalysis",
    label: "Urinalysis Report",
    labelAr: "تقرير تحليل البول",
    icon: Beaker,
    description: "Urine chemical and microscopic analysis",
  },
  {
    value: "other",
    label: "Other Medical Report",
    labelAr: "تقرير طبي آخر",
    icon: FileText,
    description: "General medical documentation",
  },
];

export default function MedicalReportsAnalysis() {
  const [selectedReportType, setSelectedReportType] = useState<ReportType | "">("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const uploadMutation = trpc.medicalReports.uploadAndAnalyze.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 16MB)
      if (file.size > 16 * 1024 * 1024) {
        alert("File size must be less than 16MB");
        return;
      }

      // Check file type
      const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        alert("Only PDF and image files (JPEG, PNG) are supported");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !selectedReportType) {
      alert("Please select both a report type and file");
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const base64Content = base64Data.split(",")[1]; // Remove data:image/png;base64, prefix

        const result = await uploadMutation.mutateAsync({
          fileName: selectedFile.name,
          fileData: base64Content,
          fileType: selectedFile.type,
          reportType: selectedReportType,
        });

        setAnalysisResult(result);
      };
    } catch (error: any) {
      console.error("Analysis error:", error);
      alert(`Analysis failed: ${error.message}`);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "destructive";
      case "urgent":
        return "destructive";
      case "semi-urgent":
        return "default";
      default:
        return "secondary";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "abnormal":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const selectedTypeInfo = REPORT_TYPES.find((t) => t.value === selectedReportType);

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Medical Reports Analysis</h1>
        <p className="text-muted-foreground">
          AI-powered analysis for pathology, blood tests, discharge summaries, ECG, and other medical reports
        </p>
      </div>

      {!analysisResult ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Medical Report
            </CardTitle>
            <CardDescription>
              Select the type of medical report and upload the file for AI-powered analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Type Selector */}
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={selectedReportType} onValueChange={(value) => setSelectedReportType(value as ReportType)}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select report type..." />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedTypeInfo && (
                <p className="text-sm text-muted-foreground">
                  <strong>Arabic:</strong> {selectedTypeInfo.labelAr} • {selectedTypeInfo.description}
                </p>
              )}
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload Report (PDF or Image)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange}
                  disabled={!selectedReportType}
                />
                {selectedFile && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <FileCheck className="h-3 w-3" />
                    {selectedFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Supported formats: PDF, JPEG, PNG • Max size: 16MB
              </p>
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!selectedFile || !selectedReportType || uploadMutation.isPending}
              className="w-full"
              size="lg"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Report...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Analyze Report
                </>
              )}
            </Button>

            {uploadMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Analysis Failed</AlertTitle>
                <AlertDescription>{uploadMutation.error.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Header with urgency and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={getUrgencyColor(analysisResult.urgency)} className="text-sm">
                {analysisResult.urgency.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Report Type: {REPORT_TYPES.find((t) => t.value === analysisResult.reportType)?.label}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setAnalysisResult(null);
                setSelectedFile(null);
                setSelectedReportType("");
              }}
            >
              Analyze Another Report
            </Button>
          </div>

          {/* Critical Flags Alert */}
          {analysisResult.criticalFlags && analysisResult.criticalFlags.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Critical Findings Detected</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {analysisResult.criticalFlags.map((flag: string, idx: number) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{analysisResult.summary}</p>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="findings" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="findings">Findings</TabsTrigger>
              <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="quality">Report Quality</TabsTrigger>
            </TabsList>

            {/* Findings Tab */}
            <TabsContent value="findings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Findings</CardTitle>
                  <CardDescription>
                    {analysisResult.findings.length} finding(s) identified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.findings.map((finding: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-l-primary pl-4 py-2">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(finding.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{finding.category}</Badge>
                              {finding.location && (
                                <Badge variant="secondary" className="text-xs">
                                  {finding.location}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{finding.finding}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Diagnosis Tab */}
            <TabsContent value="diagnosis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Diagnostic Impression</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Primary Diagnosis</Label>
                    <p className="mt-2 text-base">{analysisResult.diagnosis.primary}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Confidence:</Label>
                    <Badge variant="secondary">{analysisResult.diagnosis.confidence}%</Badge>
                  </div>

                  {analysisResult.diagnosis.differential.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold">Differential Diagnoses</Label>
                      <ul className="mt-2 space-y-1">
                        {analysisResult.diagnosis.differential.map((diff: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{diff}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Immediate Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Immediate Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.recommendations.immediate.length > 0 ? (
                      <ul className="space-y-2">
                        {analysisResult.recommendations.immediate.map((rec: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No immediate actions required</p>
                    )}
                  </CardContent>
                </Card>

                {/* Follow-up */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Follow-up
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.recommendations.followUp.length > 0 ? (
                      <ul className="space-y-2">
                        {analysisResult.recommendations.followUp.map((rec: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No follow-up required</p>
                    )}
                  </CardContent>
                </Card>

                {/* Lifestyle */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="h-4 w-4 text-green-500" />
                      Lifestyle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.recommendations.lifestyle.length > 0 ? (
                      <ul className="space-y-2">
                        {analysisResult.recommendations.lifestyle.map((rec: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No lifestyle changes suggested</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Quality Tab */}
            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Report Quality Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Completeness</Label>
                      <Badge variant="outline" className="mt-1">
                        {analysisResult.technicalQuality.completeness}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm">Readability</Label>
                      <Badge variant="outline" className="mt-1">
                        {analysisResult.technicalQuality.readability}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Quality Notes</Label>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {analysisResult.technicalQuality.notes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
