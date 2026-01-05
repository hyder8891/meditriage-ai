import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Stethoscope,
  Eye,
  FileText,
  User,
  Calendar,
  Building,
  GraduationCap,
  Loader2,
  ExternalLink,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  IdCard
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function AdminDoctorVerification() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("pending_review");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  
  // Query
  const { data, isLoading, refetch } = trpc.doctorVerification.getPendingVerifications.useQuery({
    status: selectedTab as any,
    limit: 50,
    offset: 0,
  });
  
  // Mutations
  const verifyMutation = trpc.doctorVerification.adminVerify.useMutation({
    onSuccess: () => {
      toast.success("تم التحقق من الطبيب بنجاح");
      setShowVerifyDialog(false);
      setSelectedDoctor(null);
      setVerifyNotes("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const rejectMutation = trpc.doctorVerification.adminReject.useMutation({
    onSuccess: () => {
      toast.success("تم رفض طلب التحقق");
      setShowRejectDialog(false);
      setSelectedDoctor(null);
      setRejectReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Check admin access
  if (user && user.role !== "admin" && user.role !== "super_admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You don't have permission to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending_documents":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> بانتظار المستندات</Badge>;
      case "pending_review":
        return <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600"><AlertCircle className="w-3 h-3" /> قيد المراجعة</Badge>;
      case "verified":
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="w-3 h-3" /> موثق</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> مرفوض</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };
  
  const getProcessingBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="text-xs">قيد الانتظار</Badge>;
      case "processing":
        return <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">جاري المعالجة</Badge>;
      case "completed":
        return <Badge variant="default" className="text-xs bg-emerald-600">تم المعالجة</Badge>;
      case "failed":
        return <Badge variant="destructive" className="text-xs">فشل</Badge>;
      default:
        return null;
    }
  };
  
  const handleVerify = async () => {
    if (!selectedDoctor) return;
    await verifyMutation.mutateAsync({
      doctorId: selectedDoctor.id,
      notes: verifyNotes || undefined,
    });
  };
  
  const handleReject = async () => {
    if (!selectedDoctor || !rejectReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }
    await rejectMutation.mutateAsync({
      doctorId: selectedDoctor.id,
      reason: rejectReason,
    });
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-emerald-600" />
              إدارة توثيق الأطباء
            </h1>
            <p className="text-muted-foreground">مراجعة وتوثيق حسابات الأطباء</p>
          </div>
          
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
        </div>
        
        {/* Stats */}
        {data?.counts && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{data.counts.pendingDocuments}</div>
                <div className="text-sm text-muted-foreground">بانتظار المستندات</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{data.counts.pendingReview}</div>
                <div className="text-sm text-muted-foreground">قيد المراجعة</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{data.counts.verified}</div>
                <div className="text-sm text-muted-foreground">موثق</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-red-600">{data.counts.rejected}</div>
                <div className="text-sm text-muted-foreground">مرفوض</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{data.counts.total}</div>
                <div className="text-sm text-muted-foreground">الإجمالي</div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="pending_documents">بانتظار المستندات</TabsTrigger>
            <TabsTrigger value="pending_review">قيد المراجعة</TabsTrigger>
            <TabsTrigger value="verified">موثق</TabsTrigger>
            <TabsTrigger value="rejected">مرفوض</TabsTrigger>
            <TabsTrigger value="all">الكل</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : data?.doctors.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">لا توجد طلبات</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {data?.doctors.map((doctor) => (
                  <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Doctor Info */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{doctor.name || "غير محدد"}</h3>
                              <p className="text-sm text-muted-foreground">{doctor.email || doctor.phoneNumber}</p>
                            </div>
                            {getStatusBadge(doctor.verificationStatus)}
                            {doctor.adminVerified && (
                              <Badge variant="outline" className="gap-1 border-purple-500 text-purple-600">
                                <ShieldCheck className="w-3 h-3" /> توثيق إداري
                              </Badge>
                            )}
                          </div>
                          
                          {/* Documents Section */}
                          <div className="grid md:grid-cols-2 gap-4 mt-4">
                            {/* National ID */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <IdCard className="w-5 h-5 text-blue-600" />
                                <span className="font-medium">البطاقة الوطنية</span>
                                {doctor.documents.nationalId && getProcessingBadge(doctor.documents.nationalId.processingStatus)}
                              </div>
                              
                              {doctor.documents.nationalId ? (
                                <div className="space-y-2 text-sm">
                                  {doctor.documents.nationalId.extractedName && (
                                    <p><span className="text-muted-foreground">الاسم:</span> {doctor.documents.nationalId.extractedName}</p>
                                  )}
                                  {doctor.documents.nationalId.extractedNameArabic && (
                                    <p><span className="text-muted-foreground">الاسم (عربي):</span> {doctor.documents.nationalId.extractedNameArabic}</p>
                                  )}
                                  {doctor.documents.nationalId.nameMatchScore && (
                                    <p>
                                      <span className="text-muted-foreground">نسبة التطابق:</span>{" "}
                                      <span className={parseFloat(doctor.documents.nationalId.nameMatchScore) >= 85 ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                                        {doctor.documents.nationalId.nameMatchScore}%
                                      </span>
                                    </p>
                                  )}
                                  {doctor.documents.nationalId.fileUrl && (
                                    <Button variant="outline" size="sm" className="mt-2" asChild>
                                      <a href={doctor.documents.nationalId.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Eye className="w-4 h-4 ml-1" /> عرض المستند
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">لم يتم الرفع</p>
                              )}
                            </div>
                            
                            {/* Medical Certificate */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <GraduationCap className="w-5 h-5 text-purple-600" />
                                <span className="font-medium">شهادة التخرج الطبية</span>
                                {doctor.documents.medicalCertificate && getProcessingBadge(doctor.documents.medicalCertificate.processingStatus)}
                              </div>
                              
                              {doctor.documents.medicalCertificate ? (
                                <div className="space-y-2 text-sm">
                                  {doctor.documents.medicalCertificate.extractedName && (
                                    <p><span className="text-muted-foreground">الاسم:</span> {doctor.documents.medicalCertificate.extractedName}</p>
                                  )}
                                  {doctor.documents.medicalCertificate.extractedMedicalSchool && (
                                    <p><span className="text-muted-foreground">الكلية:</span> {doctor.documents.medicalCertificate.extractedMedicalSchool}</p>
                                  )}
                                  {doctor.documents.medicalCertificate.extractedGraduationYear && (
                                    <p><span className="text-muted-foreground">سنة التخرج:</span> {doctor.documents.medicalCertificate.extractedGraduationYear}</p>
                                  )}
                                  {doctor.documents.medicalCertificate.extractedSpecialty && (
                                    <p><span className="text-muted-foreground">التخصص:</span> {doctor.documents.medicalCertificate.extractedSpecialty}</p>
                                  )}
                                  {doctor.documents.medicalCertificate.fileUrl && (
                                    <Button variant="outline" size="sm" className="mt-2" asChild>
                                      <a href={doctor.documents.medicalCertificate.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Eye className="w-4 h-4 ml-1" /> عرض المستند
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">لم يتم الرفع</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Meta Info */}
                          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              تاريخ التسجيل: {new Date(doctor.createdAt).toLocaleDateString("ar-IQ")}
                            </div>
                            {doctor.documentsSubmittedAt && (
                              <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                تاريخ تقديم المستندات: {new Date(doctor.documentsSubmittedAt).toLocaleDateString("ar-IQ")}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        {doctor.verificationStatus !== "verified" && (
                          <div className="flex flex-col gap-2 mr-4">
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowVerifyDialog(true);
                              }}
                            >
                              <ShieldCheck className="w-4 h-4 ml-1" />
                              توثيق
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                setSelectedDoctor(doctor);
                                setShowRejectDialog(true);
                              }}
                            >
                              <ShieldX className="w-4 h-4 ml-1" />
                              رفض
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Verify Dialog */}
        <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                توثيق الطبيب
              </DialogTitle>
              <DialogDescription>
                هل أنت متأكد من توثيق حساب الطبيب {selectedDoctor?.name}؟
                <br />
                <span className="text-amber-600">هذا سيتجاوز عملية التحقق التلقائي من المستندات.</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">ملاحظات (اختياري)</label>
                <Textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات حول التوثيق..."
                  className="mt-1"
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
                إلغاء
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleVerify}
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                تأكيد التوثيق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <ShieldX className="w-5 h-5" />
                رفض طلب التوثيق
              </DialogTitle>
              <DialogDescription>
                سيتم رفض طلب توثيق الطبيب {selectedDoctor?.name}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">سبب الرفض *</label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="أدخل سبب رفض الطلب..."
                  className="mt-1"
                  required
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                إلغاء
              </Button>
              <Button 
                variant="destructive"
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
              >
                {rejectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                تأكيد الرفض
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
