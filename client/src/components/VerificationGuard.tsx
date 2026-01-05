import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2, ShieldAlert, FileCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface VerificationGuardProps {
  children: React.ReactNode;
  /** If true, allows unverified doctors to access but shows a warning banner */
  softBlock?: boolean;
}

/**
 * VerificationGuard Component
 * 
 * Wraps clinician/doctor routes to ensure they have completed verification.
 * Unverified doctors are redirected to the verification page.
 * 
 * Usage:
 * <VerificationGuard>
 *   <ClinicianDashboard />
 * </VerificationGuard>
 */
export function VerificationGuard({ children, softBlock = false }: VerificationGuardProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Get verification status
  const { data: verificationStatus, isLoading } = trpc.doctorVerification.getVerificationStatus.useQuery(
    undefined,
    {
      enabled: user?.role === "clinician" || user?.role === "doctor",
      staleTime: 30000, // Cache for 30 seconds
    }
  );

  // Get document status for more details
  const { data: documentStatus } = trpc.doctorVerification.getDocumentStatus.useQuery(
    undefined,
    {
      enabled: user?.role === "clinician" || user?.role === "doctor",
      staleTime: 30000,
    }
  );

  // Admins bypass verification
  if (user?.role === "admin" || user?.role === "super_admin") {
    return <>{children}</>;
  }

  // Patients don't need verification
  if (user?.role === "patient") {
    return <>{children}</>;
  }

  // Show loading while checking verification status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">جاري التحقق من حالة الحساب...</p>
        </div>
      </div>
    );
  }

  // Check if verified (either auto-verified or admin-verified)
  const isVerified = verificationStatus?.isVerified || verificationStatus?.adminVerified;

  // If verified, render children
  if (isVerified) {
    return <>{children}</>;
  }

  // Soft block: show warning but allow access
  if (softBlock) {
    return (
      <div className="relative">
        <div className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200 p-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-800">
                حسابك غير موثق. بعض الميزات قد تكون محدودة.
              </span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-amber-500 text-amber-700 hover:bg-amber-100"
              onClick={() => setLocation("/clinician/verification")}
            >
              إكمال التوثيق
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Hard block: show verification required page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto pt-12">
        <Card className="border-amber-200 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl text-amber-800">
              التحقق من الهوية مطلوب
            </CardTitle>
            <CardDescription className="text-base mt-2">
              للوصول إلى لوحة تحكم الطبيب، يجب عليك إكمال عملية التحقق من الهوية
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Status indicator */}
            {verificationStatus?.verificationStatus && (
              <Alert className="border-blue-200 bg-blue-50">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <AlertTitle className="text-blue-800">حالة التحقق الحالية</AlertTitle>
                <AlertDescription className="text-blue-700">
                  {getStatusMessage(verificationStatus.verificationStatus)}
                </AlertDescription>
              </Alert>
            )}

            {/* Document status */}
            {documentStatus && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">المستندات المطلوبة:</h4>
                <div className="grid gap-3">
                  <DocumentStatusItem
                    label="البطاقة الوطنية (الهوية)"
                    status={documentStatus.nationalId?.processingStatus}
                    uploaded={!!documentStatus.nationalId}
                  />
                  <DocumentStatusItem
                    label="شهادة التخرج الطبية"
                    status={documentStatus.medicalCertificate?.processingStatus}
                    uploaded={!!documentStatus.medicalCertificate}
                  />
                </div>
              </div>
            )}

            {/* Requirements list */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-800">متطلبات التحقق:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  رفع صورة واضحة من البطاقة الوطنية (الهوية الموحدة)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  رفع صورة من شهادة التخرج من كلية الطب
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  يجب أن يتطابق الاسم في كلا المستندين
                </li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Button 
                size="lg" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setLocation("/clinician/verification")}
              >
                <FileCheck className="w-5 h-5 ml-2" />
                {documentStatus?.bothUploaded ? "متابعة التحقق" : "بدء عملية التحقق"}
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="w-full"
                onClick={() => setLocation("/")}
              >
                العودة للصفحة الرئيسية
              </Button>
            </div>

            {/* Help text */}
            <p className="text-xs text-center text-muted-foreground pt-2">
              إذا كنت تواجه مشكلة في التحقق، يرجى التواصل مع الدعم الفني
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStatusMessage(status: string): string {
  switch (status) {
    case "unverified":
      return "لم يتم تقديم مستندات التحقق بعد";
    case "pending_documents":
      return "بانتظار رفع المستندات المطلوبة";
    case "pending_review":
      return "المستندات قيد المراجعة من قبل الإدارة";
    case "verified":
      return "تم التحقق من حسابك بنجاح";
    case "rejected":
      return "تم رفض طلب التحقق. يرجى إعادة تقديم المستندات";
    default:
      return "حالة غير معروفة";
  }
}

interface DocumentStatusItemProps {
  label: string;
  status?: string | null;
  uploaded: boolean;
}

function DocumentStatusItem({ label, status, uploaded }: DocumentStatusItemProps) {
  const getStatusBadge = () => {
    if (!uploaded) {
      return <Badge variant="outline" className="text-gray-500">غير مرفوع</Badge>;
    }
    switch (status) {
      case "pending":
        return <Badge variant="secondary">قيد الانتظار</Badge>;
      case "processing":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">جاري المعالجة</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-emerald-600">تم المعالجة</Badge>;
      case "failed":
        return <Badge variant="destructive">فشل المعالجة</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
      <span className="text-sm text-gray-700">{label}</span>
      {getStatusBadge()}
    </div>
  );
}

export default VerificationGuard;
