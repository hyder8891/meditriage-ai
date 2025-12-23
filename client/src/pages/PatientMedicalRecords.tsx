import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  Activity,
  Microscope,
  Pill,
  FileImage,
  ChevronLeft,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function PatientMedicalRecords() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Fetch patient's medical records
  const { data: labResults, isLoading: labLoading } = trpc.lab.getMyLabResults.useQuery();
  // TODO: Add imaging results when medical imaging router is integrated
  const imagingResults: any[] = [];
  const imagingLoading = false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/patient/portal")}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'رجوع' : 'Back'}
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {language === 'ar' ? 'سجلاتي الطبية' : 'My Medical Records'}
                </h1>
                <p className="text-sm text-slate-600">
                  {language === 'ar' ? 'عرض نتائج الفحوصات والتقارير الطبية' : 'View your test results and medical reports'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="lab" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="lab">
              <Microscope className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'التحاليل' : 'Lab Results'}
            </TabsTrigger>
            <TabsTrigger value="imaging">
              <FileImage className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'الأشعة' : 'Imaging'}
            </TabsTrigger>
            <TabsTrigger value="prescriptions">
              <Pill className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'الوصفات' : 'Prescriptions'}
            </TabsTrigger>
          </TabsList>

          {/* Lab Results Tab */}
          <TabsContent value="lab" className="space-y-4">
            {labLoading ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-600">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
              </div>
            ) : labResults && labResults.length > 0 ? (
              <div className="grid gap-4">
                {labResults.map((result: any) => (
                  <Card key={result.id} className="hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Microscope className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900">
                              {result.testType || (language === 'ar' ? 'تحليل مختبري' : 'Lab Test')}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {result.createdAt ? format(new Date(result.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{result.doctorName || (language === 'ar' ? 'د. غير محدد' : 'Dr. N/A')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {language === 'ar' ? 'مكتمل' : 'Completed'}
                        </Badge>
                      </div>

                      {/* AI Interpretation */}
                      {result.interpretation && (
                        <div className="bg-slate-50 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <Activity className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-sm text-slate-900 mb-1">
                                {language === 'ar' ? 'التفسير الطبي' : 'Medical Interpretation'}
                              </h4>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                {result.interpretation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRecord(result)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                        </Button>
                        {result.fileUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(result.fileUrl, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'تحميل' : 'Download'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Microscope className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">
                      {language === 'ar' ? 'لا توجد نتائج تحاليل' : 'No Lab Results'}
                    </h3>
                    <p className="text-slate-600 mb-4">
                      {language === 'ar' 
                        ? 'سيتم عرض نتائج التحاليل التي يطلبها طبيبك هنا'
                        : 'Lab results ordered by your doctor will appear here'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Imaging Tab */}
          <TabsContent value="imaging" className="space-y-4">
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <FileImage className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {language === 'ar' ? 'لا توجد نتائج أشعة' : 'No Imaging Results'}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {language === 'ar' 
                      ? 'سيتم عرض نتائج الأشعة التي يطلبها طبيبك هنا'
                      : 'Imaging results ordered by your doctor will appear here'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="space-y-4">
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Pill className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {language === 'ar' ? 'لا توجد وصفات طبية' : 'No Prescriptions'}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {language === 'ar' 
                      ? 'سيتم عرض الوصفات الطبية من طبيبك هنا'
                      : 'Prescriptions from your doctor will appear here'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Notice */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">
                  {language === 'ar' ? 'معلومة مهمة' : 'Important Information'}
                </h4>
                <p className="text-sm text-blue-800">
                  {language === 'ar'
                    ? 'هذه السجلات للعرض فقط. لإجراء تحاليل جديدة أو طلب استشارة طبية، يرجى التواصل مع طبيبك.'
                    : 'These records are view-only. To order new tests or request medical consultation, please contact your doctor.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
