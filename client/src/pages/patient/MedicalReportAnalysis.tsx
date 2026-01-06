import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Stethoscope,
  Heart,
  Brain,
  Microscope,
  Activity,
  ClipboardList,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Download,
  Share2,
  HelpCircle,
  FileSearch,
  Lightbulb
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";
import { Streamdown } from "streamdown";

function MedicalReportAnalysisContent() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reportType, setReportType] = useState<string>("other");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const analyzeMutation = trpc.medicalReports.uploadAndAnalyze.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data);
      setIsAnalyzing(false);
      setUploadProgress(100);
      toast.success(language === 'ar' ? "تم تحليل التقرير بنجاح" : "Report analyzed successfully");
    },
    onError: (error) => {
      setIsAnalyzing(false);
      setUploadProgress(0);
      toast.error(language === 'ar' ? "فشل تحليل التقرير: " + error.message : "Analysis failed: " + error.message);
    },
  });

  // Report type options
  const reportTypes = [
    { value: "blood_test", label: language === 'ar' ? 'فحص دم' : 'Blood Test', icon: Microscope },
    { value: "pathology", label: language === 'ar' ? 'تقرير مرضي' : 'Pathology Report', icon: FileSearch },
    { value: "discharge_summary", label: language === 'ar' ? 'ملخص خروج' : 'Discharge Summary', icon: ClipboardList },
    { value: "consultation_note", label: language === 'ar' ? 'ملاحظات استشارة' : 'Consultation Note', icon: MessageSquare },
    { value: "ecg", label: language === 'ar' ? 'تخطيط قلب' : 'ECG/EKG', icon: Heart },
    { value: "pulmonary_function", label: language === 'ar' ? 'وظائف الرئة' : 'Pulmonary Function', icon: Activity },
    { value: "endoscopy", label: language === 'ar' ? 'تنظير' : 'Endoscopy', icon: Stethoscope },
    { value: "genetic_test", label: language === 'ar' ? 'فحص جيني' : 'Genetic Test', icon: Brain },
    { value: "urinalysis", label: language === 'ar' ? 'تحليل بول' : 'Urinalysis', icon: Microscope },
    { value: "other", label: language === 'ar' ? 'أخرى' : 'Other', icon: FileText },
  ];

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error(language === 'ar' ? "نوع الملف غير مدعوم" : "Unsupported file type");
      return;
    }

    // Validate file size (max 16MB)
    if (file.size > 16 * 1024 * 1024) {
      toast.error(language === 'ar' ? "حجم الملف كبير جداً (الحد الأقصى 16 ميجابايت)" : "File too large (max 16MB)");
      return;
    }

    setUploadedFile(file);
    setUploadProgress(10);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setUploadProgress(30);

      analyzeMutation.mutate({
        fileName: file.name,
        fileData: base64,
        fileType: file.type,
        reportType: reportType as any,
      });
    };
    reader.readAsDataURL(file);
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "routine":
        return "bg-green-100 text-green-800 border-green-200";
      case "soon":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "urgent":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "immediate":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Get finding severity color
  const getFindingColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "normal":
        return "border-l-green-500 bg-green-50";
      case "mild":
        return "border-l-yellow-500 bg-yellow-50";
      case "moderate":
        return "border-l-orange-500 bg-orange-50";
      case "severe":
        return "border-l-red-500 bg-red-50";
      default:
        return "border-l-slate-500 bg-slate-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ar' ? 'تحليل التقارير الطبية' : 'Medical Report Analysis'}
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'ar' 
              ? 'ارفع تقريرك الطبي واحصل على شرح مفصل وسهل الفهم'
              : 'Upload your medical report and get a detailed, easy-to-understand explanation'}
          </p>
        </div>
        <FileSearch className="w-10 h-10 text-rose-500" />
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-rose-500" />
            {language === 'ar' ? 'رفع تقرير طبي' : 'Upload Medical Report'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'ارفع أي تقرير طبي (PDF أو صورة) وسيقوم الذكاء الاصطناعي بتحليله وشرحه لك'
              : 'Upload any medical report (PDF or image) and AI will analyze and explain it to you'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Type Selection */}
          <div>
            <Label className="mb-2 block">{language === 'ar' ? 'نوع التقرير' : 'Report Type'}</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'ar' ? 'اختر نوع التقرير' : 'Select report type'} />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <input
            type="file"
            accept=".pdf,image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          {isAnalyzing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                <span className="text-slate-600">
                  {uploadProgress < 30 
                    ? (language === 'ar' ? 'جاري رفع الملف...' : 'Uploading file...')
                    : uploadProgress < 70
                    ? (language === 'ar' ? 'جاري قراءة التقرير...' : 'Reading report...')
                    : (language === 'ar' ? 'جاري التحليل بالذكاء الاصطناعي...' : 'AI analyzing...')}
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50/50 transition-all"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-rose-500" />
              </div>
              <p className="text-lg font-medium text-slate-700 mb-1">
                {language === 'ar' ? 'اسحب الملف هنا أو انقر للرفع' : 'Drag file here or click to upload'}
              </p>
              <p className="text-sm text-slate-500">
                {language === 'ar' ? 'PDF, JPG, PNG (حتى 16 ميجابايت)' : 'PDF, JPG, PNG (up to 16MB)'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="border-2 border-rose-100">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-purple-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  {language === 'ar' ? 'ملخص التقرير' : 'Report Summary'}
                </CardTitle>
                <Badge className={getUrgencyColor(analysisResult.urgency)}>
                  {analysisResult.urgency === 'routine' ? (language === 'ar' ? 'روتيني' : 'Routine') :
                   analysisResult.urgency === 'soon' ? (language === 'ar' ? 'قريباً' : 'Soon') :
                   analysisResult.urgency === 'urgent' ? (language === 'ar' ? 'عاجل' : 'Urgent') :
                   (language === 'ar' ? 'فوري' : 'Immediate')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="prose prose-slate max-w-none">
                <Streamdown>{analysisResult.summary}</Streamdown>
              </div>
            </CardContent>
          </Card>

          {/* Critical Flags */}
          {analysisResult.criticalFlags && analysisResult.criticalFlags.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>{language === 'ar' ? 'تنبيهات مهمة' : 'Important Alerts'}</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {analysisResult.criticalFlags.map((flag: string, idx: number) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Findings */}
          {analysisResult.findings && analysisResult.findings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-rose-500" />
                  {language === 'ar' ? 'النتائج التفصيلية' : 'Detailed Findings'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {analysisResult.findings.map((finding: any, idx: number) => (
                    <AccordionItem key={idx} value={`finding-${idx}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            finding.severity === 'normal' ? 'bg-green-500' :
                            finding.severity === 'mild' ? 'bg-yellow-500' :
                            finding.severity === 'moderate' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`} />
                          <span className="font-medium">{finding.name || finding.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className={`p-4 rounded-lg border-l-4 ${getFindingColor(finding.severity)}`}>
                          <p className="text-slate-700">{finding.description || finding.value}</p>
                          {finding.explanation && (
                            <p className="mt-2 text-sm text-slate-600">
                              <strong>{language === 'ar' ? 'الشرح: ' : 'Explanation: '}</strong>
                              {finding.explanation}
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Diagnosis */}
          {analysisResult.diagnosis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-rose-500" />
                  {language === 'ar' ? 'التشخيص' : 'Diagnosis'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate max-w-none">
                  <Streamdown>{analysisResult.diagnosis}</Streamdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-rose-500" />
                  {language === 'ar' ? 'التوصيات' : 'Recommendations'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-medium text-rose-600">{idx + 1}</span>
                      </div>
                      <p className="text-slate-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertTitle>{language === 'ar' ? 'تنبيه مهم' : 'Important Notice'}</AlertTitle>
            <AlertDescription>
              {language === 'ar' 
                ? 'هذا التحليل للأغراض التعليمية فقط ولا يغني عن استشارة الطبيب. يرجى مراجعة طبيبك للحصول على تشخيص دقيق وخطة علاج مناسبة.'
                : 'This analysis is for educational purposes only and does not replace medical consultation. Please consult your doctor for accurate diagnosis and appropriate treatment plan.'}
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => {
              setAnalysisResult(null);
              setUploadedFile(null);
              setUploadProgress(0);
            }}>
              <Upload className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'تحليل تقرير آخر' : 'Analyze Another Report'}
            </Button>
            <Button variant="outline" onClick={() => setLocation('/patient/find-doctors')}>
              <Stethoscope className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'استشر طبيب' : 'Consult a Doctor'}
            </Button>
          </div>
        </div>
      )}

      {/* Supported Report Types */}
      {!analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-rose-500" />
              {language === 'ar' ? 'أنواع التقارير المدعومة' : 'Supported Report Types'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {reportTypes.slice(0, -1).map((type) => (
                <div key={type.value} className="p-3 bg-slate-50 rounded-lg text-center">
                  <type.icon className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                  <p className="text-sm font-medium text-slate-700">{type.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MedicalReportAnalysis() {
  return (
    <PatientLayout>
      <MedicalReportAnalysisContent />
    </PatientLayout>
  );
}
