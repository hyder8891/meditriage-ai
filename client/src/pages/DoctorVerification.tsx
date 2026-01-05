import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  Upload, 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Stethoscope,
  GraduationCap,
  IdCard,
  FileText,
  ArrowLeft,
  Loader2
} from "lucide-react";

const SPECIALTIES = [
  "General Practice",
  "Internal Medicine",
  "Cardiology",
  "Dermatology",
  "Emergency Medicine",
  "Family Medicine",
  "Gastroenterology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Surgery",
  "Urology",
  "Other",
];

const SPECIALTIES_AR = [
  "الطب العام",
  "الطب الباطني",
  "أمراض القلب",
  "الأمراض الجلدية",
  "طب الطوارئ",
  "طب الأسرة",
  "أمراض الجهاز الهضمي",
  "طب الأعصاب",
  "أمراض النساء والتوليد",
  "الأورام",
  "طب العيون",
  "جراحة العظام",
  "طب الأطفال",
  "الطب النفسي",
  "أمراض الرئة",
  "الأشعة",
  "الجراحة العامة",
  "المسالك البولية",
  "أخرى",
];

interface FileUploadState {
  file: File | null;
  url: string | null;
  key: string | null;
  uploading: boolean;
}

export default function DoctorVerification() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [language, setLanguage] = useState<"en" | "ar">("ar");
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [medicalLicenseNumber, setMedicalLicenseNumber] = useState("");
  const [licenseIssuingAuthority, setLicenseIssuingAuthority] = useState("");
  const [licenseIssueDate, setLicenseIssueDate] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [subspecialty, setSubspecialty] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [medicalSchool, setMedicalSchool] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  
  // File upload state
  const [nationalIdDoc, setNationalIdDoc] = useState<FileUploadState>({ file: null, url: null, key: null, uploading: false });
  const [licenseDoc, setLicenseDoc] = useState<FileUploadState>({ file: null, url: null, key: null, uploading: false });
  const [degreeDoc, setDegreeDoc] = useState<FileUploadState>({ file: null, url: null, key: null, uploading: false });
  
  const nationalIdRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);
  const degreeRef = useRef<HTMLInputElement>(null);
  
  // Queries
  const { data: verificationStatus, isLoading: statusLoading, refetch: refetchStatus } = trpc.doctorVerification.getMyStatus.useQuery();
  
  // Mutations
  const submitMutation = trpc.doctorVerification.submitRequest.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تم تقديم طلب التحقق بنجاح" : "Verification request submitted successfully");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const updateMutation = trpc.doctorVerification.updateRequest.useMutation({
    onSuccess: () => {
      toast.success(language === "ar" ? "تم تحديث الطلب بنجاح" : "Request updated successfully");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Direct S3 upload mutation
  const uploadFileMutation = trpc.medicalRecords.uploadDocument.useMutation();
  
  const t = {
    title: language === "ar" ? "التحقق من هوية الطبيب" : "Doctor Verification",
    subtitle: language === "ar" 
      ? "أكمل التحقق من هويتك للوصول الكامل إلى المنصة" 
      : "Complete your identity verification for full platform access",
    personalInfo: language === "ar" ? "المعلومات الشخصية" : "Personal Information",
    professionalInfo: language === "ar" ? "المعلومات المهنية" : "Professional Information",
    documents: language === "ar" ? "المستندات المطلوبة" : "Required Documents",
    fullName: language === "ar" ? "الاسم الكامل" : "Full Name",
    dateOfBirth: language === "ar" ? "تاريخ الميلاد" : "Date of Birth",
    nationalId: language === "ar" ? "رقم الهوية الوطنية" : "National ID Number",
    licenseNumber: language === "ar" ? "رقم الترخيص الطبي" : "Medical License Number",
    issuingAuthority: language === "ar" ? "الجهة المصدرة" : "Issuing Authority",
    issueDate: language === "ar" ? "تاريخ الإصدار" : "Issue Date",
    expiryDate: language === "ar" ? "تاريخ الانتهاء" : "Expiry Date",
    specialty: language === "ar" ? "التخصص" : "Specialty",
    subspecialty: language === "ar" ? "التخصص الفرعي" : "Subspecialty",
    experience: language === "ar" ? "سنوات الخبرة" : "Years of Experience",
    medicalSchool: language === "ar" ? "كلية الطب" : "Medical School",
    graduationYear: language === "ar" ? "سنة التخرج" : "Graduation Year",
    nationalIdDoc: language === "ar" ? "صورة الهوية الوطنية" : "National ID Document",
    licenseDoc: language === "ar" ? "صورة الترخيص الطبي" : "Medical License Document",
    degreeDoc: language === "ar" ? "صورة شهادة الطب" : "Medical Degree Document",
    submit: language === "ar" ? "تقديم الطلب" : "Submit Request",
    update: language === "ar" ? "تحديث الطلب" : "Update Request",
    uploadFile: language === "ar" ? "رفع الملف" : "Upload File",
    pending: language === "ar" ? "قيد الانتظار" : "Pending",
    underReview: language === "ar" ? "قيد المراجعة" : "Under Review",
    approved: language === "ar" ? "تمت الموافقة" : "Approved",
    rejected: language === "ar" ? "مرفوض" : "Rejected",
    requiresMoreInfo: language === "ar" ? "يتطلب معلومات إضافية" : "Requires More Info",
    back: language === "ar" ? "رجوع" : "Back",
  };
  
  const handleFileUpload = async (
    file: File,
    setFileState: React.Dispatch<React.SetStateAction<FileUploadState>>,
    docType: string
  ) => {
    setFileState(prev => ({ ...prev, uploading: true }));
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        const result = await uploadFileMutation.mutateAsync({
          fileName: file.name,
          mimeType: file.type,
          fileData: base64,
          documentType: "other" as const,
        });
        
        setFileState({
          file,
          url: result.fileUrl,
          key: file.name, // Use filename as key since we don't get key back
          uploading: false,
        });
        
        toast.success(language === "ar" ? "تم رفع الملف بنجاح" : "File uploaded successfully");
      };
      
      reader.onerror = () => {
        setFileState(prev => ({ ...prev, uploading: false }));
        toast.error(language === "ar" ? "فشل في قراءة الملف" : "Failed to read file");
      };
    } catch (error) {
      setFileState(prev => ({ ...prev, uploading: false }));
      toast.error(language === "ar" ? "فشل في رفع الملف" : "Failed to upload file");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medicalLicenseNumber || !licenseIssuingAuthority || !licenseIssueDate || !fullName) {
      toast.error(language === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }
    
    if (!licenseDoc.url) {
      toast.error(language === "ar" ? "يرجى رفع صورة الترخيص الطبي" : "Please upload medical license document");
      return;
    }
    
    await submitMutation.mutateAsync({
      fullName,
      dateOfBirth: dateOfBirth || undefined,
      nationalIdNumber: nationalIdNumber || undefined,
      medicalLicenseNumber,
      licenseIssuingAuthority,
      licenseIssueDate,
      licenseExpiryDate: licenseExpiryDate || undefined,
      specialty: specialty || undefined,
      subspecialty: subspecialty || undefined,
      yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : undefined,
      medicalSchool: medicalSchool || undefined,
      graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
      nationalIdDocumentUrl: nationalIdDoc.url || undefined,
      nationalIdDocumentKey: nationalIdDoc.key || undefined,
      medicalLicenseDocumentUrl: licenseDoc.url || undefined,
      medicalLicenseDocumentKey: licenseDoc.key || undefined,
      medicalDegreeDocumentUrl: degreeDoc.url || undefined,
      medicalDegreeDocumentKey: degreeDoc.key || undefined,
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> {t.pending}</Badge>;
      case "under_review":
        return <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600"><Loader2 className="w-3 h-3 animate-spin" /> {t.underReview}</Badge>;
      case "approved":
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="w-3 h-3" /> {t.approved}</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> {t.rejected}</Badge>;
      case "requires_more_info":
        return <Badge variant="outline" className="gap-1 border-orange-500 text-orange-600"><AlertCircle className="w-3 h-3" /> {t.requiresMoreInfo}</Badge>;
      default:
        return null;
    }
  };
  
  // Show status if already submitted
  if (verificationStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-4" dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => setLocation("/clinician/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-emerald-600" />
                    {t.title}
                  </CardTitle>
                  <CardDescription>{t.subtitle}</CardDescription>
                </div>
                {getStatusBadge(verificationStatus.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {verificationStatus.status === "approved" && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <AlertTitle className="text-green-800">
                    {language === "ar" ? "تمت الموافقة على طلبك!" : "Your request has been approved!"}
                  </AlertTitle>
                  <AlertDescription className="text-green-700">
                    {language === "ar" 
                      ? "يمكنك الآن الوصول إلى جميع ميزات المنصة كطبيب معتمد."
                      : "You now have full access to all platform features as a verified doctor."}
                  </AlertDescription>
                </Alert>
              )}
              
              {verificationStatus.status === "rejected" && (
                <Alert variant="destructive">
                  <XCircle className="w-4 h-4" />
                  <AlertTitle>
                    {language === "ar" ? "تم رفض طلبك" : "Your request was rejected"}
                  </AlertTitle>
                  <AlertDescription>
                    {verificationStatus.rejectionReason || (language === "ar" 
                      ? "يرجى التواصل مع الدعم للمزيد من المعلومات."
                      : "Please contact support for more information.")}
                  </AlertDescription>
                </Alert>
              )}
              
              {verificationStatus.status === "requires_more_info" && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <AlertTitle className="text-orange-800">
                    {language === "ar" ? "مطلوب معلومات إضافية" : "Additional information required"}
                  </AlertTitle>
                  <AlertDescription className="text-orange-700">
                    {verificationStatus.additionalInfoRequested || (language === "ar" 
                      ? "يرجى تحديث طلبك بالمستندات المطلوبة."
                      : "Please update your request with the required documents.")}
                  </AlertDescription>
                </Alert>
              )}
              
              {(verificationStatus.status === "pending" || verificationStatus.status === "under_review") && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">
                    {language === "ar" ? "طلبك قيد المراجعة" : "Your request is being reviewed"}
                  </AlertTitle>
                  <AlertDescription className="text-blue-700">
                    {language === "ar" 
                      ? "سيتم إشعارك عند اكتمال المراجعة. عادة ما تستغرق المراجعة 1-3 أيام عمل."
                      : "You will be notified when the review is complete. Reviews typically take 1-3 business days."}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{t.fullName}</Label>
                    <p className="font-medium">{verificationStatus.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t.specialty}</Label>
                    <p className="font-medium">{verificationStatus.specialty || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">{t.licenseNumber}</Label>
                    <p className="font-medium">{verificationStatus.medicalLicenseNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t.issuingAuthority}</Label>
                    <p className="font-medium">{verificationStatus.licenseIssuingAuthority}</p>
                  </div>
                </div>
              </div>
              
              {verificationStatus.status === "requires_more_info" && (
                <Button 
                  onClick={() => setLocation("/doctor/verification/update")}
                  className="w-full"
                >
                  {t.update}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-4" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => setLocation("/clinician/dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.back}
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-emerald-600" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <IdCard className="w-5 h-5 text-emerald-600" />
                  {t.personalInfo}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t.fullName} *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">{t.dateOfBirth}</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nationalId">{t.nationalId}</Label>
                    <Input
                      id="nationalId"
                      value={nationalIdNumber}
                      onChange={(e) => setNationalIdNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                  {t.professionalInfo}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">{t.licenseNumber} *</Label>
                    <Input
                      id="licenseNumber"
                      value={medicalLicenseNumber}
                      onChange={(e) => setMedicalLicenseNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issuingAuthority">{t.issuingAuthority} *</Label>
                    <Input
                      id="issuingAuthority"
                      value={licenseIssuingAuthority}
                      onChange={(e) => setLicenseIssuingAuthority(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">{t.issueDate} *</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={licenseIssueDate}
                      onChange={(e) => setLicenseIssueDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">{t.expiryDate}</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={licenseExpiryDate}
                      onChange={(e) => setLicenseExpiryDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">{t.specialty}</Label>
                    <Select value={specialty} onValueChange={setSpecialty}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "ar" ? "اختر التخصص" : "Select specialty"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(language === "ar" ? SPECIALTIES_AR : SPECIALTIES).map((spec, idx) => (
                          <SelectItem key={idx} value={SPECIALTIES[idx]}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">{t.experience}</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      max="60"
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Education */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  {language === "ar" ? "التعليم" : "Education"}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicalSchool">{t.medicalSchool}</Label>
                    <Input
                      id="medicalSchool"
                      value={medicalSchool}
                      onChange={(e) => setMedicalSchool(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">{t.graduationYear}</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      min="1950"
                      max={new Date().getFullYear()}
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  {t.documents}
                </h3>
                
                <div className="grid gap-4">
                  {/* National ID */}
                  <div className="border rounded-lg p-4">
                    <Label className="mb-2 block">{t.nationalIdDoc}</Label>
                    <input
                      ref={nationalIdRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, setNationalIdDoc, "national_id");
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => nationalIdRef.current?.click()}
                      disabled={nationalIdDoc.uploading}
                      className="w-full"
                    >
                      {nationalIdDoc.uploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : nationalIdDoc.url ? (
                        <FileCheck className="w-4 h-4 mr-2 text-green-600" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {nationalIdDoc.url 
                        ? (language === "ar" ? "تم الرفع ✓" : "Uploaded ✓")
                        : t.uploadFile}
                    </Button>
                  </div>
                  
                  {/* Medical License */}
                  <div className="border rounded-lg p-4">
                    <Label className="mb-2 block">{t.licenseDoc} *</Label>
                    <input
                      ref={licenseRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, setLicenseDoc, "medical_license");
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => licenseRef.current?.click()}
                      disabled={licenseDoc.uploading}
                      className="w-full"
                    >
                      {licenseDoc.uploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : licenseDoc.url ? (
                        <FileCheck className="w-4 h-4 mr-2 text-green-600" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {licenseDoc.url 
                        ? (language === "ar" ? "تم الرفع ✓" : "Uploaded ✓")
                        : t.uploadFile}
                    </Button>
                  </div>
                  
                  {/* Medical Degree */}
                  <div className="border rounded-lg p-4">
                    <Label className="mb-2 block">{t.degreeDoc}</Label>
                    <input
                      ref={degreeRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, setDegreeDoc, "medical_degree");
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => degreeRef.current?.click()}
                      disabled={degreeDoc.uploading}
                      className="w-full"
                    >
                      {degreeDoc.uploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : degreeDoc.url ? (
                        <FileCheck className="w-4 h-4 mr-2 text-green-600" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {degreeDoc.url 
                        ? (language === "ar" ? "تم الرفع ✓" : "Uploaded ✓")
                        : t.uploadFile}
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {t.submit}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
