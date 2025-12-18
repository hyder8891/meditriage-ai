import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Pill, 
  Clock, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PatientMedications() {
  const { language } = useLanguage();
  const [selectedPrescription, setSelectedPrescription] = useState<number | null>(null);

  // Mock patient ID - in real app, get from auth context
  const patientId = 1;

  const { data: prescriptions, isLoading, refetch } = trpc.clinical.getPrescriptionsByPatient.useQuery({ 
    patientId 
  });

  const recordAdherenceMutation = trpc.clinical.updateMedicationAdherence.useMutation({
    onSuccess: () => {
      toast.success(t.adherenceRecorded);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || t.adherenceError);
    },
  });

  const handleMarkTaken = (prescriptionId: number) => {
    recordAdherenceMutation.mutate({
      prescriptionId,
      patientId,
      taken: true,
      scheduledTime: new Date(),
      takenAt: new Date(),
    });
  };

  const handleMarkMissed = (prescriptionId: number) => {
    recordAdherenceMutation.mutate({
      prescriptionId,
      patientId,
      taken: false,
      scheduledTime: new Date(),
    });
  };

  // Calculate adherence rate (mock calculation - should come from backend)
  const calculateAdherence = (prescription: any) => {
    // Mock: return random adherence between 70-95%
    return Math.floor(Math.random() * 25) + 70;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "discontinued":
        return "bg-red-100 text-red-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const t = {
    title: language === "ar" ? "أدويتي" : "My Medications",
    subtitle: language === "ar" ? "إدارة الأدوية الموصوفة والالتزام بالجرعات" : "Manage prescribed medications and track adherence",
    activeMedications: language === "ar" ? "الأدوية النشطة" : "Active Medications",
    completedMedications: language === "ar" ? "الأدوية المكتملة" : "Completed Medications",
    medicationName: language === "ar" ? "اسم الدواء" : "Medication Name",
    dosage: language === "ar" ? "الجرعة" : "Dosage",
    frequency: language === "ar" ? "التكرار" : "Frequency",
    duration: language === "ar" ? "المدة" : "Duration",
    days: language === "ar" ? "أيام" : "days",
    startDate: language === "ar" ? "تاريخ البدء" : "Start Date",
    endDate: language === "ar" ? "تاريخ الانتهاء" : "End Date",
    instructions: language === "ar" ? "التعليمات" : "Instructions",
    adherenceRate: language === "ar" ? "معدل الالتزام" : "Adherence Rate",
    markTaken: language === "ar" ? "تم الأخذ" : "Mark Taken",
    markMissed: language === "ar" ? "تم التفويت" : "Mark Missed",
    viewHistory: language === "ar" ? "عرض السجل" : "View History",
    status: language === "ar" ? "الحالة" : "Status",
    active: language === "ar" ? "نشط" : "Active",
    completed: language === "ar" ? "مكتمل" : "Completed",
    discontinued: language === "ar" ? "متوقف" : "Discontinued",
    onHold: language === "ar" ? "معلق" : "On Hold",
    noMedications: language === "ar" ? "لا توجد أدوية موصوفة" : "No prescribed medications",
    loading: language === "ar" ? "جارٍ التحميل..." : "Loading...",
    adherenceRecorded: language === "ar" ? "تم تسجيل الالتزام بنجاح" : "Adherence recorded successfully",
    adherenceError: language === "ar" ? "فشل تسجيل الالتزام" : "Failed to record adherence",
    overallAdherence: language === "ar" ? "الالتزام الإجمالي" : "Overall Adherence",
    excellent: language === "ar" ? "ممتاز" : "Excellent",
    good: language === "ar" ? "جيد" : "Good",
    needsImprovement: language === "ar" ? "يحتاج تحسين" : "Needs Improvement",
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return t.active;
      case "completed": return t.completed;
      case "discontinued": return t.discontinued;
      case "on_hold": return t.onHold;
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  const activePrescriptions = prescriptions?.filter(p => p.status === "active") || [];
  const completedPrescriptions = prescriptions?.filter(p => p.status !== "active") || [];
  const overallAdherence = activePrescriptions.length > 0
    ? Math.floor(activePrescriptions.reduce((sum, p) => sum + calculateAdherence(p), 0) / activePrescriptions.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Overall Adherence Card */}
        {activePrescriptions.length > 0 && (
          <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                {t.overallAdherence}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress value={overallAdherence} className="h-4" />
                </div>
                <div className={`text-4xl font-bold ${getAdherenceColor(overallAdherence)}`}>
                  {overallAdherence}%
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {overallAdherence >= 90 ? t.excellent : overallAdherence >= 75 ? t.good : t.needsImprovement}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Active Medications */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Pill className="w-6 h-6 text-blue-600" />
            {t.activeMedications}
          </h2>
          
          {activePrescriptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Pill className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                {t.noMedications}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activePrescriptions.map((prescription) => {
                const adherenceRate = calculateAdherence(prescription);
                
                return (
                  <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{prescription.medicationName}</CardTitle>
                          <CardDescription className="mt-1">
                            {prescription.genericName && `(${prescription.genericName})`}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(prescription.status)}>
                          {getStatusLabel(prescription.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Medication Details */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Pill className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">{t.dosage}:</span>
                            <span className="text-sm text-gray-700">{prescription.dosage}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">{t.frequency}:</span>
                            <span className="text-sm text-gray-700">{prescription.frequency}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">{t.duration}:</span>
                            <span className="text-sm text-gray-700">
                              {prescription.duration} {t.days}
                            </span>
                          </div>
                          {prescription.instructions && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 mb-1">{t.instructions}:</p>
                              <p className="text-sm text-blue-700">{prescription.instructions}</p>
                            </div>
                          )}
                        </div>

                        {/* Adherence Tracker */}
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{t.adherenceRate}</span>
                              <span className={`text-2xl font-bold ${getAdherenceColor(adherenceRate)}`}>
                                {adherenceRate}%
                              </span>
                            </div>
                            <Progress value={adherenceRate} className="h-3" />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleMarkTaken(prescription.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              disabled={recordAdherenceMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              {t.markTaken}
                            </Button>
                            <Button
                              onClick={() => handleMarkMissed(prescription.id)}
                              variant="outline"
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                              disabled={recordAdherenceMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {t.markMissed}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed/Discontinued Medications */}
        {completedPrescriptions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-gray-600" />
              {t.completedMedications}
            </h2>
            
            <div className="grid gap-4">
              {completedPrescriptions.map((prescription) => (
                <Card key={prescription.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{prescription.medicationName}</CardTitle>
                        <CardDescription>{prescription.genericName}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(prescription.status)}>
                        {getStatusLabel(prescription.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">{t.dosage}:</span> {prescription.dosage}
                      </div>
                      <div>
                        <span className="font-medium">{t.frequency}:</span> {prescription.frequency}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
