import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill, Plus, Clock, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MedicationManagement() {
  const { language } = useLanguage();
  const [showNewPrescriptionDialog, setShowNewPrescriptionDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  // Form state
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("once_daily");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: prescriptions, refetch } = trpc.clinical.getAllPrescriptions.useQuery();

  const createPrescriptionMutation = trpc.clinical.createPrescription.useMutation({
    onSuccess: () => {
      toast.success("Prescription created successfully");
      refetch();
      setShowNewPrescriptionDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create prescription");
    },
  });

  const updateAdherenceMutation = trpc.clinical.updateMedicationAdherence.useMutation({
    onSuccess: () => {
      toast.success("Adherence updated");
      refetch();
    },
  });

  const resetForm = () => {
    setMedicationName("");
    setDosage("");
    setFrequency("once_daily");
    setDuration("");
    setInstructions("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setSelectedPatientId(null);
  };

  const handleCreatePrescription = () => {
    if (!medicationName || !dosage || !duration || !selectedPatientId) {
      toast.error("Please fill in all required fields");
      return;
    }

    createPrescriptionMutation.mutate({
      patientId: selectedPatientId,
      medicationName,
      dosage,
      frequency,
      duration: parseInt(duration),
      instructions: instructions || undefined,
      startDate: new Date(startDate),
    });
  };

  const filteredPrescriptions = prescriptions?.filter((p: any) =>
    p.medicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `Patient #${p.patientId}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: prescriptions?.length || 0,
    active: prescriptions?.filter((p: any) => p.status === "active").length || 0,
    completed: prescriptions?.filter((p: any) => p.status === "completed").length || 0,
    discontinued: prescriptions?.filter((p: any) => p.status === "discontinued").length || 0,
  };

  const t = {
    title: language === "ar" ? "إدارة الأدوية" : "Medication Management",
    description: language === "ar" ? "إدارة وصفات الأدوية والالتزام بها" : "Manage prescriptions and medication adherence",
    totalPrescriptions: language === "ar" ? "إجمالي الوصفات" : "Total Prescriptions",
    active: language === "ar" ? "نشط" : "Active",
    completed: language === "ar" ? "مكتمل" : "Completed",
    discontinued: language === "ar" ? "متوقف" : "Discontinued",
    newPrescription: language === "ar" ? "وصفة جديدة" : "New Prescription",
    searchPlaceholder: language === "ar" ? "البحث عن الأدوية أو المرضى..." : "Search medications or patients...",
    patientId: language === "ar" ? "رقم المريض" : "Patient ID",
    medicationName: language === "ar" ? "اسم الدواء" : "Medication Name",
    dosage: language === "ar" ? "الجرعة" : "Dosage",
    frequency: language === "ar" ? "التكرار" : "Frequency",
    duration: language === "ar" ? "المدة (أيام)" : "Duration (days)",
    instructions: language === "ar" ? "التعليمات" : "Instructions",
    startDate: language === "ar" ? "تاريخ البدء" : "Start Date",
    status: language === "ar" ? "الحالة" : "Status",
    adherence: language === "ar" ? "الالتزام" : "Adherence",
    create: language === "ar" ? "إنشاء" : "Create",
    cancel: language === "ar" ? "إلغاء" : "Cancel",
    required: language === "ar" ? "مطلوب" : "Required",
    optional: language === "ar" ? "اختياري" : "Optional",
    onceDaily: language === "ar" ? "مرة يومياً" : "Once Daily",
    twiceDaily: language === "ar" ? "مرتين يومياً" : "Twice Daily",
    threeTimesDaily: language === "ar" ? "ثلاث مرات يومياً" : "Three Times Daily",
    fourTimesDaily: language === "ar" ? "أربع مرات يومياً" : "Four Times Daily",
    asNeeded: language === "ar" ? "عند الحاجة" : "As Needed",
    everyOtherDay: language === "ar" ? "يوم بعد يوم" : "Every Other Day",
    weekly: language === "ar" ? "أسبوعياً" : "Weekly",
    noPrescriptions: language === "ar" ? "لا توجد وصفات" : "No prescriptions found",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
            <p className="text-gray-600">{t.description}</p>
          </div>
          <Button onClick={() => setShowNewPrescriptionDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            {t.newPrescription}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.totalPrescriptions}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Pill className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">{t.active}</p>
                  <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">{t.completed}</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">{t.discontinued}</p>
                  <p className="text-2xl font-bold text-red-700">{stats.discontinued}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
          </div>
        </div>

        {/* Prescriptions List */}
        <Card>
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {!filteredPrescriptions || filteredPrescriptions.length === 0 ? (
              <div className="text-center py-12">
                <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t.noPrescriptions}</p>
                <Button onClick={() => setShowNewPrescriptionDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t.newPrescription}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPrescriptions.map((prescription: any) => (
                  <div
                    key={prescription.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{prescription.medicationName}</h3>
                          <Badge
                            className={
                              prescription.status === "active"
                                ? "bg-green-100 text-green-700"
                                : prescription.status === "completed"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {t[prescription.status as keyof typeof t] || prescription.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">{t.patientId}:</span> #{prescription.patientId}
                          </div>
                          <div>
                            <span className="font-medium">{t.dosage}:</span> {prescription.dosage}
                          </div>
                          <div>
                            <span className="font-medium">{t.frequency}:</span> {prescription.frequency}
                          </div>
                          <div>
                            <span className="font-medium">{t.duration}:</span> {prescription.duration} days
                          </div>
                        </div>
                        {prescription.instructions && (
                          <p className="text-sm text-gray-600 mt-2">{prescription.instructions}</p>
                        )}
                        {prescription.adherenceRate !== null && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{t.adherence}:</span>
                              <div className="flex-1 max-w-xs">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      prescription.adherenceRate >= 80
                                        ? "bg-green-500"
                                        : prescription.adherenceRate >= 50
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{ width: `${prescription.adherenceRate}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm font-semibold">{prescription.adherenceRate}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Prescription Dialog */}
        <Dialog open={showNewPrescriptionDialog} onOpenChange={setShowNewPrescriptionDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.newPrescription}</DialogTitle>
              <DialogDescription>Create a new prescription for a patient</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="patientId">
                  {t.patientId} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="patientId"
                  type="number"
                  value={selectedPatientId || ""}
                  onChange={(e) => setSelectedPatientId(parseInt(e.target.value))}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="medicationName">
                  {t.medicationName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="medicationName"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  placeholder="Amoxicillin"
                />
              </div>

              <div>
                <Label htmlFor="dosage">
                  {t.dosage} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="500mg"
                />
              </div>

              <div>
                <Label htmlFor="frequency">{t.frequency}</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once_daily">{t.onceDaily}</SelectItem>
                    <SelectItem value="twice_daily">{t.twiceDaily}</SelectItem>
                    <SelectItem value="three_times_daily">{t.threeTimesDaily}</SelectItem>
                    <SelectItem value="four_times_daily">{t.fourTimesDaily}</SelectItem>
                    <SelectItem value="as_needed">{t.asNeeded}</SelectItem>
                    <SelectItem value="every_other_day">{t.everyOtherDay}</SelectItem>
                    <SelectItem value="weekly">{t.weekly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">
                  {t.duration} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="7"
                />
              </div>

              <div>
                <Label htmlFor="startDate">{t.startDate}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="instructions">
                  {t.instructions} <span className="text-gray-400">({t.optional})</span>
                </Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Take with food"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPrescriptionDialog(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleCreatePrescription} disabled={createPrescriptionMutation.isPending}>
                {t.create}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
