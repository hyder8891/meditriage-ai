import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Upload, 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  IdCard,
  GraduationCap,
  ArrowLeft,
  Loader2,
  RefreshCw,
  ShieldCheck,
  User,
  Calendar,
  Award,
  Building
} from "lucide-react";

export default function DoctorVerificationNew() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  
  const idInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  
  // Get document status
  const { 
    data: documentStatus, 
    isLoading: statusLoading, 
    refetch: refetchStatus 
  } = trpc.doctorVerification.getDocumentStatus.useQuery();
  
  // Upload mutation
  const uploadMutation = trpc.doctorVerification.uploadDocument.useMutation({
    onSuccess: (data) => {
      toast.success("تم رفع المستند بنجاح وجاري معالجته");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في رفع المستند");
    },
  });
  
  // Trigger verification mutation
  const verifyMutation = trpc.doctorVerification.triggerVerification.useMutation({
    onSuccess: (data) => {
      if (data.verified) {
        toast.success("تم التحقق من حسابك بنجاح! يمكنك الآن الوصول إلى جميع الميزات.");
      } else {
        toast.info(`نسبة تطابق الاسم: ${data.nameMatchScore}%. سيتم مراجعة طلبك من قبل الإدارة.`);
      }
      refetchStatus();
    },
    onError: (error) => {
      toast.error(error.message || "فشل في التحقق");
    },
  });
  
  const handleFileUpload = useCallback(async (
    file: File,
    documentType: "national_id" | "medical_certificate"
  ) => {
    const setUploading = documentType === "national_id" ? setUploadingId : setUploadingCert;
    setUploading(true);
    
    try {
      // Validate file
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast.error("يرجى رفع صورة أو ملف PDF");
        setUploading(false);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت");
        setUploading(false);
        return;
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        await uploadMutation.mutateAsync({
          documentType,
          fileData: base64,
          fileName: file.name,
          mimeType: file.type,
        });
        
        setUploading(false);
      };
      
      reader.onerror = () => {
        toast.error("فشل في قراءة الملف");
        setUploading(false);
      };
    } catch (error) {
      setUploading(false);
    }
  }, [uploadMutation]);
  
  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, "national_id");
    }
  };
  
  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, "medical_certificate");
    }
  };
  
  const handleTriggerVerification = () => {
    verifyMutation.mutate();
  };
  
  // If already verified, show success
  if (documentStatus?.isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-4" dir="rtl">
        <div className="max-w-2xl mx-auto pt-12">
          <Card className="border-emerald-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-10 h-10 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl text-emerald-800">
                تم التحقق من حسابك
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {documentStatus.adminVerified 
                  ? "تم التحقق من حسابك بواسطة الإدارة"
                  : "تم التحقق من هويتك تلقائياً"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Button 
                size="lg" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setLocation("/clinician/dashboard")}
              >
                الانتقال إلى لوحة التحكم
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Calculate progress
  const getProgress = () => {
    let progress = 0;
    if (documentStatus?.nationalId) progress += 25;
    if (documentStatus?.nationalId?.processingStatus === "completed") progress += 25;
    if (documentStatus?.medicalCertificate) progress += 25;
    if (documentStatus?.medicalCertificate?.processingStatus === "completed") progress += 25;
    return progress;
  };
  
  const canTriggerVerification = 
    documentStatus?.bothProcessed && 
    documentStatus?.verificationStatus !== "verified";
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">التحقق من هوية الطبيب</h1>
            <p className="text-muted-foreground">أكمل التحقق للوصول الكامل إلى المنصة</p>
          </div>
        </div>
        
        {/* Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">تقدم التحقق</span>
              <span className="text-sm text-muted-foreground">{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </CardContent>
        </Card>
        
        {/* Status Alert */}
        {documentStatus?.verificationStatus === "pending_review" && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Clock className="w-4 h-4 text-amber-600" />
            <AlertTitle className="text-amber-800">قيد المراجعة</AlertTitle>
            <AlertDescription className="text-amber-700">
              مستنداتك قيد المراجعة من قبل الإدارة. سيتم إعلامك عند اكتمال المراجعة.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Document Upload Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* National ID Card */}
          <Card className={`transition-all ${documentStatus?.nationalId?.processingStatus === "completed" ? "border-emerald-200" : ""}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  documentStatus?.nationalId?.processingStatus === "completed" 
                    ? "bg-emerald-100" 
                    : "bg-blue-100"
                }`}>
                  <IdCard className={`w-6 h-6 ${
                    documentStatus?.nationalId?.processingStatus === "completed" 
                      ? "text-emerald-600" 
                      : "text-blue-600"
                  }`} />
                </div>
                <div>
                  <CardTitle className="text-lg">البطاقة الوطنية</CardTitle>
                  <CardDescription>الهوية الموحدة العراقية</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {documentStatus?.nationalId ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm truncate max-w-[150px]">
                      {documentStatus.nationalId.fileName}
                    </span>
                    {getStatusBadge(documentStatus.nationalId.processingStatus)}
                  </div>
                  
                  {/* Extracted Info */}
                  {documentStatus.nationalId.processingStatus === "completed" && (
                    <div className="space-y-2 p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs font-medium text-emerald-800 mb-2">المعلومات المستخرجة:</p>
                      {documentStatus.nationalId.extractedName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-emerald-600" />
                          <span>{documentStatus.nationalId.extractedName}</span>
                        </div>
                      )}
                      {documentStatus.nationalId.extractedNameArabic && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-emerald-600" />
                          <span>{documentStatus.nationalId.extractedNameArabic}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => idInputRef.current?.click()}
                    disabled={uploadingId}
                  >
                    {uploadingId ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 ml-2" />
                    )}
                    إعادة الرفع
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                  onClick={() => idInputRef.current?.click()}
                >
                  {uploadingId ? (
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">اضغط لرفع صورة الهوية</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF حتى 10MB</p>
                    </>
                  )}
                </div>
              )}
              
              <input
                ref={idInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleIdFileChange}
              />
            </CardContent>
          </Card>
          
          {/* Medical Certificate Card */}
          <Card className={`transition-all ${documentStatus?.medicalCertificate?.processingStatus === "completed" ? "border-emerald-200" : ""}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  documentStatus?.medicalCertificate?.processingStatus === "completed" 
                    ? "bg-emerald-100" 
                    : "bg-purple-100"
                }`}>
                  <GraduationCap className={`w-6 h-6 ${
                    documentStatus?.medicalCertificate?.processingStatus === "completed" 
                      ? "text-emerald-600" 
                      : "text-purple-600"
                  }`} />
                </div>
                <div>
                  <CardTitle className="text-lg">شهادة التخرج الطبية</CardTitle>
                  <CardDescription>شهادة بكالوريوس الطب والجراحة</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {documentStatus?.medicalCertificate ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm truncate max-w-[150px]">
                      {documentStatus.medicalCertificate.fileName}
                    </span>
                    {getStatusBadge(documentStatus.medicalCertificate.processingStatus)}
                  </div>
                  
                  {/* Extracted Info */}
                  {documentStatus.medicalCertificate.processingStatus === "completed" && (
                    <div className="space-y-2 p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs font-medium text-emerald-800 mb-2">المعلومات المستخرجة:</p>
                      {documentStatus.medicalCertificate.extractedName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-emerald-600" />
                          <span>{documentStatus.medicalCertificate.extractedName}</span>
                        </div>
                      )}
                      {documentStatus.medicalCertificate.extractedMedicalSchool && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="w-4 h-4 text-emerald-600" />
                          <span>{documentStatus.medicalCertificate.extractedMedicalSchool}</span>
                        </div>
                      )}
                      {documentStatus.medicalCertificate.extractedGraduationYear && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span>سنة التخرج: {documentStatus.medicalCertificate.extractedGraduationYear}</span>
                        </div>
                      )}
                      {documentStatus.medicalCertificate.extractedSpecialty && (
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span>{documentStatus.medicalCertificate.extractedSpecialty}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => certInputRef.current?.click()}
                    disabled={uploadingCert}
                  >
                    {uploadingCert ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 ml-2" />
                    )}
                    إعادة الرفع
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all"
                  onClick={() => certInputRef.current?.click()}
                >
                  {uploadingCert ? (
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">اضغط لرفع شهادة التخرج</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF حتى 10MB</p>
                    </>
                  )}
                </div>
              )}
              
              <input
                ref={certInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleCertFileChange}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Name Match Result */}
        {documentStatus?.nationalId?.nameMatchScore && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">نتيجة مطابقة الاسم</p>
                  <p className="text-sm text-muted-foreground">
                    مقارنة الاسم بين الهوية وشهادة التخرج
                  </p>
                </div>
                <div className="text-left">
                  <span className={`text-2xl font-bold ${
                    parseFloat(documentStatus.nationalId.nameMatchScore) >= 85 
                      ? "text-emerald-600" 
                      : "text-amber-600"
                  }`}>
                    {documentStatus.nationalId.nameMatchScore}%
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {parseFloat(documentStatus.nationalId.nameMatchScore) >= 85 
                      ? "تطابق ممتاز" 
                      : "يحتاج مراجعة"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Verification Button */}
        <div className="mt-6">
          <Button 
            size="lg" 
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={!canTriggerVerification || verifyMutation.isPending}
            onClick={handleTriggerVerification}
          >
            {verifyMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
            ) : (
              <ShieldCheck className="w-5 h-5 ml-2" />
            )}
            {canTriggerVerification 
              ? "التحقق من المستندات" 
              : "يرجى رفع ومعالجة جميع المستندات أولاً"}
          </Button>
          
          {!canTriggerVerification && documentStatus?.bothUploaded && !documentStatus?.bothProcessed && (
            <p className="text-center text-sm text-amber-600 mt-2">
              <Loader2 className="w-4 h-4 animate-spin inline ml-1" />
              جاري معالجة المستندات...
            </p>
          )}
        </div>
        
        {/* Info Section */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h4 className="font-medium text-blue-800 mb-3">كيف تعمل عملية التحقق؟</h4>
            <ol className="space-y-2 text-sm text-blue-700 list-decimal list-inside">
              <li>ارفع صورة واضحة من البطاقة الوطنية (الهوية الموحدة)</li>
              <li>ارفع صورة من شهادة التخرج من كلية الطب</li>
              <li>سيتم استخراج المعلومات تلقائياً من المستندات</li>
              <li>إذا تطابق الاسم في كلا المستندين، سيتم التحقق تلقائياً</li>
              <li>في حال عدم التطابق، سيتم إرسال الطلب للمراجعة اليدوية</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStatusBadge(status?: string | null) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> قيد الانتظار</Badge>;
    case "processing":
      return <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600"><Loader2 className="w-3 h-3 animate-spin" /> جاري المعالجة</Badge>;
    case "completed":
      return <Badge variant="default" className="gap-1 bg-emerald-600"><CheckCircle2 className="w-3 h-3" /> تم المعالجة</Badge>;
    case "failed":
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> فشل</Badge>;
    default:
      return null;
  }
}
