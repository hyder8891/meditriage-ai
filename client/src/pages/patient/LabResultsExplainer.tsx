import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  FlaskConical,
  Heart,
  Activity,
  Droplets,
  Zap,
  ArrowRight,
  Download,
  Share2,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";
import { Streamdown } from "streamdown";

function LabResultsExplainerContent() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const labReportsQuery = trpc.lab.getMyLabReports.useQuery();
  const dashboardQuery = trpc.lab.getDashboardSummary.useQuery();

  // Mutations
  const uploadMutation = trpc.lab.uploadLabReport.useMutation({
    onSuccess: async (data) => {
      toast.success(language === 'ar' ? "تم رفع التقرير بنجاح" : "Report uploaded successfully");
      setUploadProgress(50);
      // Process the report
      processReportMutation.mutate({ reportId: data.reportId });
    },
    onError: (error) => {
      toast.error(language === 'ar' ? "فشل رفع التقرير: " + error.message : "Upload failed: " + error.message);
      setUploadProgress(0);
    },
  });

  const processReportMutation = trpc.lab.processLabReport.useMutation({
    onSuccess: (data) => {
      toast.success(language === 'ar' ? "تم تحليل التقرير بنجاح" : "Report analyzed successfully");
      setUploadProgress(100);
      labReportsQuery.refetch();
      dashboardQuery.refetch();
      // Fetch the full report
      if (data.resultsCount > 0) {
        setSelectedTab("results");
      }
    },
    onError: (error) => {
      toast.error(language === 'ar' ? "فشل تحليل التقرير: " + error.message : "Analysis failed: " + error.message);
      setUploadProgress(0);
    },
  });

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

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setUploadProgress(25);

      uploadMutation.mutate({
        fileName: file.name,
        fileData: base64,
        fileType: file.type,
        reportDate: new Date().toISOString(),
        reportName: file.name.replace(/\.[^/.]+$/, ""),
      });
    };
    reader.readAsDataURL(file);
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "normal":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "high":
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "low":
        return <TrendingDown className="w-4 h-4 text-blue-500" />;
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "normal":
        return "bg-green-100 text-green-800 border-green-200";
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "critical":
        return "bg-red-200 text-red-900 border-red-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Get risk color
  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "low":
        return "bg-green-500";
      case "moderate":
        return "bg-yellow-500";
      case "high":
        return "bg-orange-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ar' ? 'شرح نتائج الفحوصات' : 'Lab Results Explainer'}
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'ar' 
              ? 'ارفع تقرير فحوصاتك واحصل على شرح مبسط'
              : 'Upload your lab report and get a simple explanation'}
          </p>
        </div>
        <FlaskConical className="w-10 h-10 text-rose-500" />
      </div>

      {/* Dashboard Summary */}
      {dashboardQuery.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-slate-900">{dashboardQuery.data.totalReports}</p>
              <p className="text-sm text-slate-600">{language === 'ar' ? 'تقارير' : 'Reports'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-slate-900">{dashboardQuery.data.totalResults - dashboardQuery.data.abnormalCount}</p>
              <p className="text-sm text-slate-600">{language === 'ar' ? 'طبيعي' : 'Normal'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
            <CardContent className="p-4 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-slate-900">{dashboardQuery.data.abnormalCount}</p>
              <p className="text-sm text-slate-600">{language === 'ar' ? 'غير طبيعي' : 'Abnormal'}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-100">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold text-slate-900">{dashboardQuery.data.criticalCount}</p>
              <p className="text-sm text-slate-600">{language === 'ar' ? 'حرج' : 'Critical'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-rose-500" />
            {language === 'ar' ? 'رفع تقرير جديد' : 'Upload New Report'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'ارفع تقرير فحوصاتك (PDF أو صورة) وسنشرحه لك بلغة بسيطة'
              : 'Upload your lab report (PDF or image) and we\'ll explain it in simple terms'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".pdf,image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          {uploadProgress > 0 && uploadProgress < 100 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                <span className="text-slate-600">
                  {uploadProgress < 50 
                    ? (language === 'ar' ? 'جاري رفع الملف...' : 'Uploading file...')
                    : (language === 'ar' ? 'جاري تحليل التقرير...' : 'Analyzing report...')}
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

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-500" />
            {language === 'ar' ? 'تقاريري السابقة' : 'My Previous Reports'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {labReportsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : labReportsQuery.data && labReportsQuery.data.length > 0 ? (
            <div className="space-y-3">
              {labReportsQuery.data.slice(0, 5).map((report: any) => (
                <div 
                  key={report.id} 
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/patient/lab-results/${report.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRiskColor(report.riskLevel)} bg-opacity-20`}>
                      <FileText className={`w-5 h-5 ${report.riskLevel === 'critical' ? 'text-red-600' : report.riskLevel === 'high' ? 'text-orange-600' : 'text-green-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{report.reportName || language === 'ar' ? 'تقرير فحوصات' : 'Lab Report'}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(report.reportDate).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(report.riskLevel === 'low' ? 'normal' : report.riskLevel)}>
                      {report.riskLevel === 'low' ? (language === 'ar' ? 'طبيعي' : 'Normal') :
                       report.riskLevel === 'moderate' ? (language === 'ar' ? 'متوسط' : 'Moderate') :
                       report.riskLevel === 'high' ? (language === 'ar' ? 'مرتفع' : 'High') :
                       (language === 'ar' ? 'حرج' : 'Critical')}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>{language === 'ar' ? 'لا توجد تقارير سابقة' : 'No previous reports'}</p>
              <Button 
                variant="link" 
                onClick={() => fileInputRef.current?.click()}
                className="mt-2"
              >
                {language === 'ar' ? 'ارفع تقريرك الأول' : 'Upload your first report'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Understanding Your Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-rose-500" />
            {language === 'ar' ? 'فهم نتائجك' : 'Understanding Your Results'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">{language === 'ar' ? 'طبيعي' : 'Normal'}</span>
              </div>
              <p className="text-sm text-green-700">
                {language === 'ar' 
                  ? 'النتيجة ضمن المعدل الطبيعي. لا داعي للقلق.'
                  : 'Result is within normal range. No concerns.'}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">{language === 'ar' ? 'منخفض' : 'Low'}</span>
              </div>
              <p className="text-sm text-blue-700">
                {language === 'ar' 
                  ? 'النتيجة أقل من المعدل الطبيعي. قد يحتاج متابعة.'
                  : 'Result is below normal range. May need follow-up.'}
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">{language === 'ar' ? 'مرتفع' : 'High'}</span>
              </div>
              <p className="text-sm text-orange-700">
                {language === 'ar' 
                  ? 'النتيجة أعلى من المعدل الطبيعي. استشر طبيبك.'
                  : 'Result is above normal range. Consult your doctor.'}
              </p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">{language === 'ar' ? 'حرج' : 'Critical'}</span>
              </div>
              <p className="text-sm text-red-700">
                {language === 'ar' 
                  ? 'نتيجة تحتاج اهتمام فوري. تواصل مع طبيبك حالاً.'
                  : 'Result needs immediate attention. Contact your doctor now.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LabResultsExplainer() {
  return (
    <PatientLayout>
      <LabResultsExplainerContent />
    </PatientLayout>
  );
}
