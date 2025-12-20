import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  FileText,
  Pill,
  Activity,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  Thermometer,
  Droplet,
  Stethoscope,
  Crown,
  Zap
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation, Link } from "wouter";
import { PatientVitalsInput } from "@/components/PatientVitalsInput";
import { PatientReminders } from "@/components/PatientReminders";

export default function PatientPortal() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const { data: usage } = trpc.b2b2c.subscription.getUsageStats.useQuery();

  // Mock patient ID - in real app, get from auth context
  const patientId = 1;

  const { data: appointments } = trpc.clinical.getAppointmentsByPatient.useQuery({ patientId });
  const { data: prescriptions } = trpc.clinical.getPrescriptionsByPatient.useQuery({ patientId });
  // Messages feature to be implemented
  const messages: any[] = [];

  const t = {
    title: language === "ar" ? "بوابة المريض" : "Patient Portal",
    subtitle: language === "ar" ? "الوصول إلى سجلاتك الطبية والتواصل مع طبيبك" : "Access your medical records and communicate with your doctor",
    overview: language === "ar" ? "نظرة عامة" : "Overview",
    appointments: language === "ar" ? "المواعيد" : "Appointments",
    medications: language === "ar" ? "الأدوية" : "Medications",
    vitalSigns: language === "ar" ? "العلامات الحيوية" : "Vital Signs",
    messages: language === "ar" ? "الرسائل" : "Messages",
    upcomingAppointments: language === "ar" ? "المواعيد القادمة" : "Upcoming Appointments",
    activeMedications: language === "ar" ? "الأدوية النشطة" : "Active Medications",
    recentVitals: language === "ar" ? "العلامات الحيوية الأخيرة" : "Recent Vitals",
    unreadMessages: language === "ar" ? "رسائل غير مقروءة" : "Unread Messages",
    symptomChecker: language === "ar" ? "فاحص الأعراض" : "Symptom Checker",
    checkSymptoms: language === "ar" ? "فحص الأعراض" : "Check Symptoms",
    viewAll: language === "ar" ? "عرض الكل" : "View All",
    noAppointments: language === "ar" ? "لا توجد مواعيد قادمة" : "No upcoming appointments",
    noMedications: language === "ar" ? "لا توجد أدوية نشطة" : "No active medications",
    noMessages: language === "ar" ? "لا توجد رسائل جديدة" : "No new messages",
    bookAppointment: language === "ar" ? "حجز موعد" : "Book Appointment",
    viewMedications: language === "ar" ? "عرض الأدوية" : "View Medications",
    sendMessage: language === "ar" ? "إرسال رسالة" : "Send Message",
    date: language === "ar" ? "التاريخ" : "Date",
    time: language === "ar" ? "الوقت" : "Time",
    doctor: language === "ar" ? "الطبيب" : "Doctor",
    status: language === "ar" ? "الحالة" : "Status",
    pending: language === "ar" ? "قيد الانتظار" : "Pending",
    confirmed: language === "ar" ? "مؤكد" : "Confirmed",
    completed: language === "ar" ? "مكتمل" : "Completed",
    cancelled: language === "ar" ? "ملغى" : "Cancelled",
    medication: language === "ar" ? "الدواء" : "Medication",
    dosage: language === "ar" ? "الجرعة" : "Dosage",
    frequency: language === "ar" ? "التكرار" : "Frequency",
    from: language === "ar" ? "من" : "From",
    subject: language === "ar" ? "الموضوع" : "Subject",
    bloodPressure: language === "ar" ? "ضغط الدم" : "Blood Pressure",
    heartRate: language === "ar" ? "معدل القلب" : "Heart Rate",
    temperature: language === "ar" ? "درجة الحرارة" : "Temperature",
    oxygenSaturation: language === "ar" ? "تشبع الأكسجين" : "Oxygen Saturation",
    bpm: language === "ar" ? "نبضة/دقيقة" : "bpm",
    celsius: language === "ar" ? "°س" : "°C",
    mmHg: language === "ar" ? "ملم زئبق" : "mmHg",
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: t.pending, className: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: t.confirmed, className: "bg-green-100 text-green-800" },
      completed: { label: t.completed, className: "bg-blue-100 text-blue-800" },
      cancelled: { label: t.cancelled, className: "bg-red-100 text-red-800" },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <Badge className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const upcomingAppointments = appointments?.filter(a => 
    a.status === "pending" || a.status === "confirmed"
  ).slice(0, 3) || [];

  const activePrescriptions = prescriptions?.filter(p => p.status === "active").slice(0, 3) || [];
  
  const unreadMessages = messages?.filter((m: any) => !m.isRead).slice(0, 3) || [];

  // Mock vital signs data
  const recentVitals = {
    bloodPressure: "120/80",
    heartRate: 72,
    temperature: 36.6,
    oxygenSaturation: 98,
    recordedAt: new Date().toLocaleDateString(),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">{t.overview}</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">{t.appointments}</span>
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              <span className="hidden sm:inline">{t.medications}</span>
            </TabsTrigger>
            <TabsTrigger value="vitals" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">{t.vitalSigns}</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{t.messages}</span>
              {unreadMessages.length > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                  {unreadMessages.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">{language === "ar" ? "الاشتراك" : "Subscription"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Symptom Checker Banner */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Stethoscope className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{t.symptomChecker}</h3>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" 
                          ? "احصل على تقييم فوري لأعراضك بواسطة الذكاء الاصطناعي"
                          : "Get instant AI-powered assessment of your symptoms"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="lg"
                    onClick={() => setLocation("/symptom-checker")}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Activity className="mr-2 h-5 w-5" />
                    {t.checkSymptoms}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Upcoming Appointments Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    {t.upcomingAppointments}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">{t.noAppointments}</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.map((apt) => (
                        <div key={apt.id} className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {new Date(apt.appointmentDate).toLocaleDateString()}
                            </span>
                            {getStatusBadge(apt.status)}
                          </div>
                          <p className="text-xs text-gray-600">{apt.notes || 'Appointment'}</p>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setActiveTab("appointments")}
                      >
                        {t.viewAll}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Medications Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-green-600" />
                    {t.activeMedications}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activePrescriptions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">{t.noMedications}</p>
                  ) : (
                    <div className="space-y-3">
                      {activePrescriptions.map((rx) => (
                        <div key={rx.id} className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium">{rx.medicationName}</p>
                          <p className="text-xs text-gray-600">{rx.dosage} - {rx.frequency}</p>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation("/patient/medications")}
                      >
                        {t.viewMedications}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Vitals Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-600" />
                    {t.recentVitals}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-red-600" />
                        <span className="text-sm">{t.bloodPressure}</span>
                      </div>
                      <span className="text-sm font-medium">{recentVitals.bloodPressure} {t.mmHg}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-pink-50 rounded">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-600" />
                        <span className="text-sm">{t.heartRate}</span>
                      </div>
                      <span className="text-sm font-medium">{recentVitals.heartRate} {t.bpm}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">{t.temperature}</span>
                      </div>
                      <span className="text-sm font-medium">{recentVitals.temperature}{t.celsius}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("vitals")}
                    >
                      {t.viewAll}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages Card */}
            {unreadMessages.length > 0 && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    {t.unreadMessages}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {unreadMessages.map((msg: any) => (
                      <div key={msg.id} className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">Dr. {msg.senderName}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.sentAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{msg.content.substring(0, 100)}...</p>
                      </div>
                    ))}
                    <Button 
                      className="w-full"
                      onClick={() => setActiveTab("messages")}
                    >
                      {t.viewAll}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other tabs would be implemented similarly */}
          <TabsContent value="medications">
            <div className="space-y-6">
              <PatientReminders patientId={patientId} />
              
              <Card>
                <CardHeader>
                  <CardTitle>{t.medications}</CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'عرض أدويتك الحالية' : 'View your current medications'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setLocation("/patient/medications")}>
                    {t.viewMedications}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vitals">
            <div className="space-y-6">
              <PatientVitalsInput patientId={patientId} />
              
              <Card>
                <CardHeader>
                  <CardTitle>{t.vitalSigns} {language === 'ar' ? 'السابقة' : 'History'}</CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'عرض سجل العلامات الحيوية' : 'View your vital signs history'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    {language === 'ar' ? 'سيتم عرض سجل العلامات الحيوية هنا' : 'Vital signs history will be displayed here'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>{t.messages}</CardTitle>
                <CardDescription>Communicate with your healthcare provider</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Secure messaging interface will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  {language === "ar" ? "إدارة الاشتراك" : "Subscription Management"}
                </CardTitle>
                <CardDescription>
                  {language === "ar" 
                    ? "عرض وإدارة خطة اشتراكك"
                    : "View and manage your subscription plan"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setLocation("/patient/subscription")}
                  className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                  size="lg"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  {language === "ar" ? "عرض خطط الاشتراك" : "View Subscription Plans"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
