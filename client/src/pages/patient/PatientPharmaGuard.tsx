import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Pill, 
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Plus,
  Trash2,
  Shield,
  Info,
  Heart,
  Clock,
  Sparkles
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";

function PatientPharmaGuardContent() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<any>(null);
  const [isAddMedDialogOpen, setIsAddMedDialogOpen] = useState(false);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New medication form state
  const [newMed, setNewMed] = useState({
    drugName: "",
    dosage: "",
    frequency: "",
    purpose: "",
  });

  // Queries
  const patientMedsQuery = trpc.pharmaguard.getMyMedications.useQuery(
    { activeOnly: true },
    { enabled: true }
  );

  const patientConditionsQuery = trpc.pharmaguard.getMyConditions.useQuery(
    { activeOnly: true },
    { enabled: true }
  );

  // Mutations
  const checkPersonalizedMutation = trpc.pharmaguard.checkPersonalizedInteractions.useMutation({
    onSuccess: (data: any) => {
      setInteractions(data);
      if (!data.safe) {
        toast.error(language === 'ar' ? "⚠️ تم اكتشاف مخاوف أمان!" : "⚠️ Safety concerns detected!");
      } else if (data.interactions && data.interactions.length > 0) {
        toast.warning(language === 'ar' ? `تم العثور على ${data.interactions.length} تفاعل` : `Found ${data.interactions.length} interaction(s)`);
      } else {
        toast.success(language === 'ar' ? "✅ آمن للاستخدام مع الأدوية الحالية" : "✅ Safe to use with current medications");
      }
    },
    onError: (error: any) => {
      toast.error(language === 'ar' ? "فشل الفحص: " + error.message : "Check failed: " + error.message);
    },
  });

  const addMedicationMutation = trpc.pharmaguard.addMedication.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تمت إضافة الدواء بنجاح" : "Medication added successfully");
      patientMedsQuery.refetch();
      setIsAddMedDialogOpen(false);
      setNewMed({
        drugName: "",
        dosage: "",
        frequency: "",
        purpose: "",
      });
    },
    onError: (error: any) => {
      toast.error(language === 'ar' ? "فشلت إضافة الدواء: " + error.message : "Failed to add medication: " + error.message);
    },
  });

  const removeMedicationMutation = trpc.pharmaguard.removeMedication.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم إزالة الدواء" : "Medication removed");
      patientMedsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(language === 'ar' ? "فشل إزالة الدواء: " + error.message : "Failed to remove medication: " + error.message);
    },
  });

  const uploadImageMutation = trpc.pharmaguard.uploadMedicineImage.useMutation({
    onSuccess: async (data) => {
      toast.success(language === 'ar' ? "تم رفع الصورة، جاري تحديد الدواء..." : "Image uploaded, identifying medicine...");
      identifyMedicineMutation.mutate({ imageId: data.imageId });
    },
    onError: (error: any) => {
      toast.error(language === 'ar' ? "فشل الرفع: " + error.message : "Upload failed: " + error.message);
    },
  });

  const identifyMedicineMutation = trpc.pharmaguard.identifyMedicine.useMutation({
    onSuccess: (data) => {
      if (data.identified) {
        toast.success(language === 'ar' ? `تم التعرف: ${data.drugName} ${data.dosage}` : `Identified: ${data.drugName} ${data.dosage}`);
        setNewMed({
          drugName: data.drugName || "",
          dosage: data.dosage || "",
          frequency: "",
          purpose: "",
        });
        setIsImageUploadOpen(false);
        setIsAddMedDialogOpen(true);
      } else {
        toast.error(language === 'ar' ? "لم يتم التعرف على الدواء" : "Could not identify medicine");
      }
    },
    onError: (error: any) => {
      toast.error(language === 'ar' ? "فشل التعرف: " + error.message : "Identification failed: " + error.message);
    },
  });

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setUploadedImage(base64);
      
      // Upload and identify
      uploadImageMutation.mutate({
        imageData: base64.split(",")[1],
        fileName: file.name,
        fileType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle check interactions
  const handleCheckInteractions = () => {
    if (selectedMeds.length === 0) {
      toast.error(language === 'ar' ? "الرجاء إدخال دواء واحد على الأقل" : "Please enter at least one medication");
      return;
    }

    checkPersonalizedMutation.mutate({
      newDrugs: selectedMeds,
    });
  };

  // Add medication to check list
  const addMedToCheck = () => {
    if (searchQuery.trim() && !selectedMeds.includes(searchQuery.trim())) {
      setSelectedMeds([...selectedMeds, searchQuery.trim()]);
      setSearchQuery("");
    }
  };

  // Remove medication from check list
  const removeMedFromCheck = (med: string) => {
    setSelectedMeds(selectedMeds.filter((m) => m !== med));
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "major":
      case "severe":
        return "bg-red-100 text-red-800 border-red-200";
      case "moderate":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "minor":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ar' ? 'فحص تفاعل الأدوية' : 'Drug Interaction Checker'}
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'ar' 
              ? 'تحقق من سلامة أدويتك قبل تناولها'
              : 'Check if your medications are safe to take together'}
          </p>
        </div>
        <Shield className="w-10 h-10 text-rose-500" />
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <Pill className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">{language === 'ar' ? 'أدويتي الحالية' : 'My Current Meds'}</p>
              <p className="text-xl font-bold text-slate-900">{patientMedsQuery.data?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">{language === 'ar' ? 'حالاتي الصحية' : 'My Conditions'}</p>
              <p className="text-xl font-bold text-slate-900">{patientConditionsQuery.data?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">{language === 'ar' ? 'آخر فحص' : 'Last Check'}</p>
              <p className="text-xl font-bold text-slate-900">{language === 'ar' ? 'آمن' : 'Safe'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interaction Checker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-rose-500" />
            {language === 'ar' ? 'فحص دواء جديد' : 'Check New Medication'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'أدخل اسم الدواء الذي تريد التحقق منه مع أدويتك الحالية'
              : 'Enter the medication name you want to check against your current medications'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={language === 'ar' ? 'ابحث عن دواء...' : 'Search for a medication...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMedToCheck()}
                className="pl-10"
              />
            </div>
            <Button onClick={addMedToCheck} disabled={!searchQuery.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              {language === 'ar' ? 'إضافة' : 'Add'}
            </Button>
            <Button variant="outline" onClick={() => setIsImageUploadOpen(true)}>
              <Camera className="w-4 h-4 mr-1" />
              {language === 'ar' ? 'صورة' : 'Photo'}
            </Button>
          </div>

          {/* Selected Medications */}
          {selectedMeds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMeds.map((med) => (
                <Badge key={med} variant="secondary" className="px-3 py-1 text-sm">
                  {med}
                  <button onClick={() => removeMedFromCheck(med)} className="ml-2">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Check Button */}
          <Button 
            onClick={handleCheckInteractions}
            disabled={selectedMeds.length === 0 || checkPersonalizedMutation.isPending}
            className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
          >
            {checkPersonalizedMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === 'ar' ? 'جاري الفحص...' : 'Checking...'}
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'فحص التفاعلات' : 'Check Interactions'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Interaction Results */}
      {interactions && (
        <Card className={interactions.safe ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {interactions.safe ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-green-700">
                    {language === 'ar' ? 'آمن للاستخدام' : 'Safe to Use'}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700">
                    {language === 'ar' ? 'تحذير: تفاعلات محتملة' : 'Warning: Potential Interactions'}
                  </span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            {interactions.summary && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertTitle>{language === 'ar' ? 'ملخص' : 'Summary'}</AlertTitle>
                <AlertDescription>{interactions.summary}</AlertDescription>
              </Alert>
            )}

            {/* Interactions List */}
            {interactions.interactions && interactions.interactions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700">
                  {language === 'ar' ? 'التفاعلات المكتشفة:' : 'Detected Interactions:'}
                </h4>
                {interactions.interactions.map((interaction: any, idx: number) => (
                  <div key={idx} className={`p-4 rounded-lg border ${getSeverityColor(interaction.severity)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">
                        {interaction.drug1} + {interaction.drug2}
                      </div>
                      <Badge variant="outline" className={getSeverityColor(interaction.severity)}>
                        {interaction.severity}
                      </Badge>
                    </div>
                    <p className="text-sm">{interaction.description}</p>
                    {interaction.recommendation && (
                      <p className="text-sm mt-2 font-medium">
                        💡 {interaction.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {interactions.recommendations && interactions.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-700">
                  {language === 'ar' ? 'التوصيات:' : 'Recommendations:'}
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                  {interactions.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Current Medications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-rose-500" />
                {language === 'ar' ? 'أدويتي الحالية' : 'My Current Medications'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'قائمة الأدوية التي تتناولها حالياً'
                  : 'List of medications you are currently taking'}
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddMedDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              {language === 'ar' ? 'إضافة دواء' : 'Add Medication'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {patientMedsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : patientMedsQuery.data && patientMedsQuery.data.length > 0 ? (
            <div className="space-y-3">
              {patientMedsQuery.data.map((med: any) => (
                <div key={med.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{med.drugName}</p>
                      <p className="text-sm text-slate-500">
                        {med.dosage} • {med.frequency}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeMedicationMutation.mutate({ medicationId: med.id })}
                  >
                    <Trash2 className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Pill className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>{language === 'ar' ? 'لم تضف أي أدوية بعد' : 'No medications added yet'}</p>
              <Button 
                variant="link" 
                onClick={() => setIsAddMedDialogOpen(true)}
                className="mt-2"
              >
                {language === 'ar' ? 'أضف دواءك الأول' : 'Add your first medication'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Medication Dialog */}
      <Dialog open={isAddMedDialogOpen} onOpenChange={setIsAddMedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إضافة دواء جديد' : 'Add New Medication'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'أدخل معلومات الدواء الذي تتناوله'
                : 'Enter the details of the medication you are taking'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === 'ar' ? 'اسم الدواء' : 'Medication Name'}</Label>
              <Input
                value={newMed.drugName}
                onChange={(e) => setNewMed({ ...newMed, drugName: e.target.value })}
                placeholder={language === 'ar' ? 'مثال: باراسيتامول' : 'e.g., Paracetamol'}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'الجرعة' : 'Dosage'}</Label>
              <Input
                value={newMed.dosage}
                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                placeholder={language === 'ar' ? 'مثال: 500 ملغ' : 'e.g., 500mg'}
              />
            </div>
            <div>
              <Label>{language === 'ar' ? 'عدد المرات' : 'Frequency'}</Label>
              <Select
                value={newMed.frequency}
                onValueChange={(value) => setNewMed({ ...newMed, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر عدد المرات' : 'Select frequency'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once_daily">{language === 'ar' ? 'مرة يومياً' : 'Once daily'}</SelectItem>
                  <SelectItem value="twice_daily">{language === 'ar' ? 'مرتين يومياً' : 'Twice daily'}</SelectItem>
                  <SelectItem value="three_times_daily">{language === 'ar' ? 'ثلاث مرات يومياً' : 'Three times daily'}</SelectItem>
                  <SelectItem value="as_needed">{language === 'ar' ? 'عند الحاجة' : 'As needed'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'ar' ? 'الغرض (اختياري)' : 'Purpose (optional)'}</Label>
              <Input
                value={newMed.purpose}
                onChange={(e) => setNewMed({ ...newMed, purpose: e.target.value })}
                placeholder={language === 'ar' ? 'مثال: للصداع' : 'e.g., For headache'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMedDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={() => addMedicationMutation.mutate({
                drugName: newMed.drugName,
                dosage: newMed.dosage,
                frequency: newMed.frequency,
                purpose: newMed.purpose,
                source: "self_reported",
              })}
              disabled={!newMed.drugName || addMedicationMutation.isPending}
            >
              {addMedicationMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {language === 'ar' ? 'إضافة' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={isImageUploadOpen} onOpenChange={setIsImageUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'التقاط صورة للدواء' : 'Take Photo of Medication'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'التقط صورة واضحة لعلبة الدواء أو الحبة'
                : 'Take a clear photo of the medication box or pill'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {uploadedImage ? (
              <div className="relative">
                <img src={uploadedImage} alt="Uploaded" className="w-full rounded-lg" />
                {uploadImageMutation.isPending || identifyMedicineMutation.isPending ? (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>{language === 'ar' ? 'جاري التعرف...' : 'Identifying...'}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-rose-400 transition-colors"
              >
                <Camera className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-600">
                  {language === 'ar' ? 'انقر لالتقاط صورة' : 'Click to take a photo'}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsImageUploadOpen(false);
              setUploadedImage(null);
            }}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            {uploadedImage && !uploadImageMutation.isPending && !identifyMedicineMutation.isPending && (
              <Button onClick={() => fileInputRef.current?.click()}>
                {language === 'ar' ? 'إعادة التقاط' : 'Retake'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PatientPharmaGuard() {
  return (
    <PatientLayout>
      <PatientPharmaGuardContent />
    </PatientLayout>
  );
}
