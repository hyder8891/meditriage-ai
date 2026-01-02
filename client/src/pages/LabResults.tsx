import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  Calendar,
  Download,
  Eye,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { LabUploadDialog } from "@/components/lab/LabUploadDialog";
import { LabReportCard } from "@/components/lab/LabReportCard";
import { LabDashboard } from "@/components/lab/LabDashboard";
import { LabTrendsView } from "@/components/lab/LabTrendsView";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LabResults() {
  const { language } = useLanguage();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const { data: summary, isLoading: summaryLoading } = trpc.lab.getDashboardSummary.useQuery();
  const { data: reports, isLoading: reportsLoading } = trpc.lab.getMyLabReports.useQuery();
  const { data: abnormalResults } = trpc.lab.getAbnormalResults.useQuery();
  const { data: criticalResults } = trpc.lab.getCriticalResults.useQuery();

  const getRiskBadge = (riskLevel: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string; labelAr: string }> = {
      low: { variant: "default", icon: CheckCircle, label: "Low Risk", labelAr: "خطر منخفض" },
      moderate: { variant: "secondary", icon: Activity, label: "Moderate Risk", labelAr: "خطر متوسط" },
      high: { variant: "destructive", icon: AlertCircle, label: "High Risk", labelAr: "خطر عالي" },
      critical: { variant: "destructive", icon: AlertCircle, label: "Critical", labelAr: "حرج" },
    };

    const config = variants[riskLevel] || variants.low;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {language === 'ar' ? config.labelAr : config.label}
      </Badge>
    );
  };

  return (
    <ClinicianLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{language === 'ar' ? 'نتائج التحاليل' : 'Lab Results'}</h1>
            <p className="text-slate-600 mt-1">
              {language === 'ar' ? 'تفسير وتحليل تقارير المختبر بالذكاء الاصطناعي' : 'AI-powered lab report interpretation and analysis'}
            </p>
          </div>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'رفع تقرير مختبر' : 'Upload Lab Report'}
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {language === 'ar' ? 'إجمالي التقارير' : 'Total Reports'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {summary.totalReports}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'ar' ? `${summary.totalResults} فحص إجمالي` : `${summary.totalResults} total tests`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {language === 'ar' ? 'نتائج غير طبيعية' : 'Abnormal Results'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {summary.abnormalCount}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'ar' ? 'تتطلب اهتمام' : 'Require attention'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {language === 'ar' ? 'قيم حرجة' : 'Critical Values'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {summary.criticalCount}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'ar' ? 'يتطلب إجراء فوري' : 'Immediate action needed'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {language === 'ar' ? 'أحدث تقرير' : 'Latest Report'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.latestReport ? (
                  <>
                    <div className="text-sm font-semibold text-slate-900">
                      {new Date(summary.latestReport.reportDate).toLocaleDateString()}
                    </div>
                    <div className="mt-2">
                      {getRiskBadge(summary.latestReport.riskLevel || "low")}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-500">{language === 'ar' ? 'لا توجد تقارير بعد' : 'No reports yet'}</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="dashboard">
              <Activity className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'جميع التقارير' : 'All Reports'}
            </TabsTrigger>
            <TabsTrigger value="trends">
              <TrendingUp className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'الاتجاهات' : 'Trends'}
            </TabsTrigger>
            <TabsTrigger value="abnormal">
              <AlertCircle className="w-4 h-4 mr-2" />
              {language === 'ar' ? `غير طبيعي (${abnormalResults?.length || 0})` : `Abnormal (${abnormalResults?.length || 0})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <LabDashboard />
          </TabsContent>

          <TabsContent value="reports" className="mt-6 space-y-4">
            {reportsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-600 mt-4">{language === 'ar' ? 'جاري تحميل التقارير...' : 'Loading reports...'}</p>
              </div>
            ) : reports && reports.length > 0 ? (
              reports.map((report: any) => (
                <LabReportCard key={report.id} report={report} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {language === 'ar' ? 'لا توجد تقارير مختبر بعد' : 'No Lab Reports Yet'}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {language === 'ar' ? 'قم برفع أول تقرير مختبر للبدء بالتحليل بالذكاء الاصطناعي' : 'Upload your first lab report to get started with AI-powered analysis'}
                  </p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'رفع تقرير مختبر' : 'Upload Lab Report'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            <LabTrendsView />
          </TabsContent>

          <TabsContent value="abnormal" className="mt-6">
            {abnormalResults && abnormalResults.length > 0 ? (
              <div className="space-y-4">
                {abnormalResults.map((result: any) => (
                  <Card key={result.id} className="border-orange-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{result.testName}</CardTitle>
                        <Badge variant="destructive">
                          {result.criticalFlag ? (language === 'ar' ? 'حرج' : 'Critical') : (language === 'ar' ? 'غير طبيعي' : 'Abnormal')}
                        </Badge>
                      </div>
                      <CardDescription>
                        {new Date(result.testDate).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {result.value}
                        </span>
                        <span className="text-slate-600">{result.unit}</span>
                        <span className="text-sm text-slate-500">
                          ({language === 'ar' ? 'طبيعي' : 'Normal'}: {result.referenceRangeText})
                        </span>
                      </div>
                      
                      {result.interpretation && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-slate-700">{result.interpretation}</p>
                        </div>
                      )}

                      {result.recommendedFollowUp && (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-orange-900 mb-1">
                            {language === 'ar' ? 'الإجراء الموصى به:' : 'Recommended Action:'}
                          </p>
                          <p className="text-sm text-orange-700">
                            {result.recommendedFollowUp}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {language === 'ar' ? 'جميع النتائج طبيعية' : 'All Results Normal'}
                  </h3>
                  <p className="text-slate-600">
                    {language === 'ar' ? 'لم يتم العثور على نتائج مختبر غير طبيعية' : 'No abnormal lab results found'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Upload Dialog */}
        <LabUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
        />
      </div>
    </ClinicianLayout>
  );
}
