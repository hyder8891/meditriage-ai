import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Activity, 
  FileText, 
  MessageSquare,
  Clock,
  Heart,
  Thermometer,
  Droplet
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PatientDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Fetch patient profile (includes cases, vitals, and prescriptions)
  const { data: patientData, isLoading } = trpc.b2b2c.doctor.getPatientProfile.useQuery(
    { patientId: parseInt(id || "0") },
    { enabled: !!id }
  );

  const patient = patientData?.patient;
  const cases = patientData?.cases || [];

  if (isLoading) {
    return (
      <ClinicianLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-slate-600">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        </div>
      </ClinicianLayout>
    );
  }

  if (!patient) {
    return (
      <ClinicianLayout>
        <div className="text-center py-12">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {isArabic ? 'المريض غير موجود' : 'Patient Not Found'}
          </h2>
          <p className="text-slate-600 mb-6">
            {isArabic ? 'لم يتم العثور على بيانات المريض' : 'Patient data could not be found'}
          </p>
          <Button onClick={() => navigate('/clinician/my-patients')}>
            {isArabic ? 'العودة إلى قائمة المرضى' : 'Back to Patients'}
          </Button>
        </div>
      </ClinicianLayout>
    );
  }

  return (
    <ClinicianLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isArabic ? 'ملف المريض' : 'Patient Profile'}
            </h1>
            <p className="text-slate-600 mt-1">
              {isArabic ? 'معلومات المريض والسجل الطبي' : 'Patient information and medical history'}
            </p>
          </div>
          <Button onClick={() => navigate('/clinician/my-patients')} variant="outline">
            {isArabic ? 'العودة' : 'Back'}
          </Button>
        </div>

        {/* Patient Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {isArabic ? 'المعلومات الشخصية' : 'Personal Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    {isArabic ? 'الاسم' : 'Name'}
                  </label>
                  <p className="text-lg font-semibold text-slate-900">{patient.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    {isArabic ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <p className="text-slate-900 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {patient.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    {isArabic ? 'رقم الهاتف' : 'Phone'}
                  </label>
                  <p className="text-slate-900 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {patient.phoneNumber || (isArabic ? 'غير متوفر' : 'Not available')}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    {isArabic ? 'تاريخ الاتصال' : 'Connection Date'}
                  </label>
                  <p className="text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString(isArabic ? 'ar-IQ' : 'en-US') : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    {isArabic ? 'الحالة' : 'Status'}
                  </label>
                  <div>
                    <Badge variant={patient.accountStatus === 'active' ? 'default' : 'secondary'}>
                      {patient.accountStatus === 'active' 
                        ? (isArabic ? 'نشط' : 'Active')
                        : (isArabic ? 'غير نشط' : 'Inactive')
                      }
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    {isArabic ? 'آخر استشارة' : 'Last Consultation'}
                  </label>
                  <p className="text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {patient.lastSignedIn 
                      ? new Date(patient.lastSignedIn).toLocaleDateString(isArabic ? 'ar-IQ' : 'en-US')
                      : (isArabic ? 'لا توجد استشارات سابقة' : 'No previous consultations')
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Medical History */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">
              <FileText className="w-4 h-4 mr-2" />
              {isArabic ? 'السجل الطبي' : 'Medical History'}
            </TabsTrigger>
            <TabsTrigger value="vitals">
              <Activity className="w-4 h-4 mr-2" />
              {isArabic ? 'العلامات الحيوية' : 'Vital Signs'}
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              {isArabic ? 'الرسائل' : 'Messages'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'الحالات الطبية السابقة' : 'Previous Cases'}</CardTitle>
              </CardHeader>
              <CardContent>
                {cases && cases.length > 0 ? (
                  <div className="space-y-4">
                    {cases.map((caseItem: any) => (
                      <div key={caseItem.id} className="border-l-4 border-teal-500 pl-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{caseItem.chiefComplaint}</h4>
                          <Badge variant="outline">
                            {new Date(caseItem.createdAt).toLocaleDateString(isArabic ? 'ar-IQ' : 'en-US')}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{caseItem.symptoms}</p>
                        {caseItem.diagnosis && (
                          <p className="text-sm text-teal-700 mt-2">
                            <strong>{isArabic ? 'التشخيص:' : 'Diagnosis:'}</strong> {caseItem.diagnosis}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">
                    {isArabic ? 'لا توجد حالات طبية سابقة' : 'No previous medical cases'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'آخر العلامات الحيوية' : 'Latest Vital Signs'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">{isArabic ? 'ضغط الدم' : 'Blood Pressure'}</p>
                    <p className="text-xl font-bold text-slate-900">120/80</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">{isArabic ? 'معدل النبض' : 'Heart Rate'}</p>
                    <p className="text-xl font-bold text-slate-900">72 bpm</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Thermometer className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">{isArabic ? 'درجة الحرارة' : 'Temperature'}</p>
                    <p className="text-xl font-bold text-slate-900">37°C</p>
                  </div>
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <Droplet className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">{isArabic ? 'الأكسجين' : 'SpO2'}</p>
                    <p className="text-xl font-bold text-slate-900">98%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>{isArabic ? 'الرسائل' : 'Messages'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    {isArabic ? 'ابدأ محادثة مع المريض' : 'Start a conversation with the patient'}
                  </p>
                  <Button onClick={() => navigate('/clinician/messages')}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {isArabic ? 'إرسال رسالة' : 'Send Message'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClinicianLayout>
  );
}
