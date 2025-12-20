import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Check, Crown, Zap, AlertCircle, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const PATIENT_PLANS = [
  {
    id: "free",
    name: "Free",
    nameAr: "مجاني",
    price: 0,
    priceAr: "٠",
    consultations: 3,
    features: [
      "3 AI consultations per month",
      "Basic symptom checker",
      "Health tips and recommendations",
      "Community support"
    ],
    featuresAr: [
      "٣ استشارات ذكاء اصطناعي شهرياً",
      "فحص الأعراض الأساسي",
      "نصائح صحية وتوصيات",
      "دعم المجتمع"
    ]
  },
  {
    id: "lite",
    name: "Lite",
    nameAr: "لايت",
    price: 2.99,
    priceAr: "٢.٩٩",
    consultations: 10,
    features: [
      "10 AI consultations per month",
      "Advanced symptom analysis",
      "Connect with 2 doctors",
      "Priority support",
      "Health record storage"
    ],
    featuresAr: [
      "١٠ استشارات ذكاء اصطناعي شهرياً",
      "تحليل متقدم للأعراض",
      "الاتصال بطبيبين",
      "دعم ذو أولوية",
      "تخزين السجلات الصحية"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    nameAr: "برو",
    price: 5.99,
    priceAr: "٥.٩٩",
    consultations: -1, // unlimited
    features: [
      "Unlimited AI consultations",
      "Connect with unlimited doctors",
      "24/7 priority support",
      "Advanced health analytics",
      "Medication reminders",
      "Family health management"
    ],
    featuresAr: [
      "استشارات ذكاء اصطناعي غير محدودة",
      "الاتصال بأطباء غير محدودين",
      "دعم ذو أولوية ٢٤/٧",
      "تحليلات صحية متقدمة",
      "تذكيرات الأدوية",
      "إدارة صحة الأسرة"
    ]
  }
];

export default function PatientSubscription() {
  const { user } = useAuth();
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  
  const { data: subscription, isLoading: subLoading } = trpc.b2b2c.subscription.getCurrent.useQuery();
  const { data: usage, isLoading: usageLoading } = trpc.b2b2c.subscription.getUsageStats.useQuery();
  
  const upgradeMutation = trpc.b2b2c.subscription.createOrUpgrade.useMutation({
    onSuccess: () => {
      alert(language === "ar" ? "تم الترقية بنجاح!" : "Upgraded successfully!");
      window.location.reload();
    },
    onError: (error) => {
      alert(language === "ar" ? `خطأ: ${error.message}` : `Error: ${error.message}`);
    }
  });

  const cancelMutation = trpc.b2b2c.subscription.cancel.useMutation({
    onSuccess: () => {
      alert(language === "ar" ? "تم إلغاء الاشتراك" : "Subscription cancelled");
      window.location.reload();
    }
  });

  const handleUpgrade = (planId: string) => {
    if (!user) {
      alert(language === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please login first");
      return;
    }
    
    const plan = PATIENT_PLANS.find(p => p.id === planId);
    if (!plan) return;

    upgradeMutation.mutate({
      planId: planId,
      billingCycle: "monthly"
    });
  };

  const handleCancel = () => {
    if (confirm(language === "ar" ? "هل أنت متأكد من إلغاء اشتراكك؟" : "Are you sure you want to cancel?")) {
      cancelMutation.mutate();
    }
  };

  const currentPlan = subscription?.planType || "free";
  const consultationsUsed = usage?.consultationsUsed || 0;
  const currentPlanData = PATIENT_PLANS.find(p => p.id === currentPlan);
  const consultationsLimit = currentPlanData?.consultations || 3;

  if (subLoading || usageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {language === "ar" ? "إدارة الاشتراك" : "Subscription Management"}
          </h1>
          <button
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition"
          >
            {language === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Current Plan Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                {language === "ar" ? "خطتك الحالية" : "Your Current Plan"}
              </h2>
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                <span className="text-2xl font-bold text-teal-600">
                  {language === "ar" ? currentPlanData?.nameAr : currentPlanData?.name}
                </span>
              </div>
            </div>
            {currentPlan !== "free" && (
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
              >
                {language === "ar" ? "إلغاء الاشتراك" : "Cancel Subscription"}
              </button>
            )}
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-slate-600">
                  {language === "ar" ? "الاستشارات المستخدمة" : "Consultations Used"}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {consultationsUsed} / {consultationsLimit === -1 ? "∞" : consultationsLimit}
              </p>
              {consultationsLimit !== -1 && (
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((consultationsUsed / consultationsLimit) * 100, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-slate-600">
                  {language === "ar" ? "السعر الشهري" : "Monthly Price"}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                ${currentPlanData?.price || 0}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-slate-600">
                  {language === "ar" ? "الحالة" : "Status"}
                </span>
              </div>
              <p className="text-lg font-semibold text-green-600">
                {language === "ar" ? "نشط" : "Active"}
              </p>
            </div>
          </div>

          {/* Warning if nearing limit */}
          {consultationsLimit !== -1 && consultationsUsed >= consultationsLimit * 0.8 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                {language === "ar"
                  ? "أنت تقترب من حد الاستشارات الشهري. قم بالترقية للحصول على المزيد!"
                  : "You're approaching your monthly consultation limit. Upgrade for more!"}
              </p>
            </div>
          )}
        </div>

        {/* Plan Comparison */}
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
          {language === "ar" ? "قارن الخطط" : "Compare Plans"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PATIENT_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isUpgrade = PATIENT_PLANS.findIndex(p => p.id === plan.id) > PATIENT_PLANS.findIndex(p => p.id === currentPlan);

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  isCurrent ? "ring-2 ring-teal-500" : ""
                }`}
              >
                {isCurrent && (
                  <div className="bg-teal-500 text-white text-center py-2 text-sm font-semibold">
                    {language === "ar" ? "الخطة الحالية" : "Current Plan"}
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    {language === "ar" ? plan.nameAr : plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-teal-600">
                      ${plan.price}
                    </span>
                    <span className="text-slate-600">
                      /{language === "ar" ? "شهر" : "month"}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {(language === "ar" ? plan.featuresAr : plan.features).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && isUpgrade && (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgradeMutation.isPending}
                      className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg font-semibold hover:from-teal-600 hover:to-blue-600 transition disabled:opacity-50"
                    >
                      {language === "ar" ? "ترقية الآن" : "Upgrade Now"}
                    </button>
                  )}

                  {isCurrent && (
                    <div className="w-full py-3 bg-slate-100 text-slate-600 rounded-lg font-semibold text-center">
                      {language === "ar" ? "خطتك الحالية" : "Your Current Plan"}
                    </div>
                  )}

                  {!isCurrent && !isUpgrade && (
                    <div className="w-full py-3 bg-slate-50 text-slate-400 rounded-lg font-semibold text-center">
                      {language === "ar" ? "غير متاح" : "Not Available"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Billing History Placeholder */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            {language === "ar" ? "سجل الفواتير" : "Billing History"}
          </h2>
          <p className="text-slate-600 text-center py-8">
            {language === "ar"
              ? "لا توجد فواتير حتى الآن. سيظهر سجل الدفع هنا بعد الترقية."
              : "No billing history yet. Payment records will appear here after upgrading."}
          </p>
        </div>
      </div>
    </div>
  );
}
