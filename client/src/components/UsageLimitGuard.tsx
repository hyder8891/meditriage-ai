import { ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Crown } from "lucide-react";
import { Link } from "wouter";

interface UsageLimitGuardProps {
  children: ReactNode;
  feature: "consultation" | "doctor_connection";
  userRole: "patient" | "doctor" | "clinician";
  language?: "ar" | "en";
}

/**
 * Component that checks usage limits before allowing access to features
 * Shows upgrade prompt when limit is reached
 */
export function UsageLimitGuard({ children, feature, userRole, language = "ar" }: UsageLimitGuardProps) {
  const { data: usage, isLoading } = trpc.b2b2c.subscription.getUsageStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Check if limit is reached
  let limitReached = false;
  let limitMessage = "";
  let upgradeUrl = "";

  if (feature === "consultation" && userRole === "patient") {
    const limit = usage?.consultationsLimit || 3;
    const used = usage?.consultationsUsed || 0;
    
    if (limit !== -1 && used >= limit) {
      limitReached = true;
      limitMessage = language === "ar"
        ? `لقد استخدمت ${used} من ${limit} استشارات هذا الشهر. قم بالترقية للحصول على المزيد!`
        : `You've used ${used} of ${limit} consultations this month. Upgrade for more!`;
      upgradeUrl = "/patient/subscription";
    }
  }

  if (feature === "doctor_connection" && userRole === "patient") {
    const limit = usage?.patientsLimit || 1;
    const connected = usage?.patientsConnected || 0;
    
    if (limit !== -1 && connected >= limit) {
      limitReached = true;
      limitMessage = language === "ar"
        ? `لقد وصلت إلى حد الأطباء (${connected}/${limit}). قم بالترقية للاتصال بالمزيد من الأطباء!`
        : `You've reached your doctor limit (${connected}/${limit}). Upgrade to connect with more doctors!`;
      upgradeUrl = "/patient/subscription";
    }
  }

  if (feature === "doctor_connection" && (userRole === "doctor" || userRole === "clinician")) {
    const limit = usage?.patientsLimit || 100;
    const connected = usage?.patientsConnected || 0;
    
    if (limit !== -1 && connected >= limit) {
      limitReached = true;
      limitMessage = language === "ar"
        ? `لقد وصلت إلى حد المرضى (${connected}/${limit}). قم بالترقية إلى Premium للحصول على مرضى غير محدودين!`
        : `You've reached your patient limit (${connected}/${limit}). Upgrade to Premium for unlimited patients!`;
      upgradeUrl = "/clinician/subscription";
    }
  }

  // If limit reached, show upgrade prompt instead of children
  if (limitReached) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 rounded-full p-4">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">
            {language === "ar" ? "تم الوصول إلى الحد" : "Limit Reached"}
          </h2>

          <p className="text-slate-600 mb-6 text-center">
            {limitMessage}
          </p>

          <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-slate-800">
                {language === "ar" ? "قم بالترقية الآن" : "Upgrade Now"}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {language === "ar"
                ? "احصل على وصول غير محدود إلى جميع الميزات مع خطة Pro الخاصة بنا"
                : "Get unlimited access to all features with our Pro plan"}
            </p>
          </div>

          <Link href={upgradeUrl}>
            <button className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-blue-600 transition">
              {language === "ar" ? "عرض الخطط" : "View Plans"}
            </button>
          </Link>

          <Link href={userRole === "patient" ? "/patient/portal" : "/clinician/dashboard"}>
            <button className="w-full mt-3 py-3 bg-slate-100 text-slate-600 rounded-lg font-semibold hover:bg-slate-200 transition">
              {language === "ar" ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // If limit not reached, render children normally
  return <>{children}</>;
}
