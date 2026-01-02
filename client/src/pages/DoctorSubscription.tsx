import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Check, Crown, Users, AlertCircle, CreditCard, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

const DOCTOR_PLANS = [
  {
    id: "basic",
    name: "Basic",
    nameAr: "أساسي",
    price: 120,
    priceAr: "١٢٠",
    maxPatients: 100,
    features: [
      "Up to 100 active patients",
      "Patient management dashboard",
      "Secure messaging",
      "Appointment scheduling",
      "Basic analytics",
      "Email support"
    ],
    featuresAr: [
      "حتى ١٠٠ مريض نشط",
      "لوحة إدارة المرضى",
      "رسائل آمنة",
      "جدولة المواعيد",
      "تحليلات أساسية",
      "دعم عبر البريد الإلكتروني"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    nameAr: "بريميوم",
    price: 200,
    priceAr: "٢٠٠",
    maxPatients: -1, // unlimited
    features: [
      "Unlimited active patients",
      "Advanced patient management",
      "Priority secure messaging",
      "Advanced appointment system",
      "Comprehensive analytics & reports",
      "Prescription management",
      "Medical records integration",
      "24/7 priority support",
      "API access"
    ],
    featuresAr: [
      "مرضى نشطون غير محدودين",
      "إدارة متقدمة للمرضى",
      "رسائل آمنة ذات أولوية",
      "نظام مواعيد متقدم",
      "تحليلات وتقارير شاملة",
      "إدارة الوصفات الطبية",
      "تكامل السجلات الطبية",
      "دعم ذو أولوية ٢٤/٧",
      "وصول API"
    ]
  }
];

export default function DoctorSubscription() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  
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
    
    const plan = DOCTOR_PLANS.find(p => p.id === planId);
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

  const currentPlan = subscription?.planType || "basic";
  const patientsConnected = usage?.patientsConnected || 0;
  const currentPlanData = DOCTOR_PLANS.find(p => p.id === currentPlan);
  const patientsLimit = currentPlanData?.maxPatients || 100;

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
            {currentPlan !== "basic" && (
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
                <Users className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-slate-600">
                  {language === "ar" ? "المرضى النشطون" : "Active Patients"}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {patientsConnected} / {patientsLimit === -1 ? "∞" : patientsLimit}
              </p>
              {patientsLimit !== -1 && (
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((patientsConnected / patientsLimit) * 100, 100)}%` }}
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

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-slate-600">
                  {language === "ar" ? "الإيرادات المحتملة" : "Potential Revenue"}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                ${patientsConnected * 5.99}/mo
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {language === "ar" ? "متوسط من المرضى" : "Average from patients"}
              </p>
            </div>
          </div>

          {/* Warning if nearing limit */}
          {patientsLimit !== -1 && patientsConnected >= patientsLimit * 0.8 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                {language === "ar"
                  ? "أنت تقترب من حد المرضى. قم بالترقية إلى Premium للحصول على مرضى غير محدودين!"
                  : "You're approaching your patient limit. Upgrade to Premium for unlimited patients!"}
              </p>
            </div>
          )}
        </div>

        {/* Plan Comparison */}
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
          {language === "ar" ? "قارن الخطط" : "Compare Plans"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {DOCTOR_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isUpgrade = DOCTOR_PLANS.findIndex(p => p.id === plan.id) > DOCTOR_PLANS.findIndex(p => p.id === currentPlan);

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  isCurrent ? "ring-2 ring-teal-500" : ""
                } ${plan.id === "premium" ? "md:scale-105" : ""}`}
              >
                {isCurrent && (
                  <div className="bg-teal-500 text-white text-center py-2 text-sm font-semibold">
                    {language === "ar" ? "الخطة الحالية" : "Current Plan"}
                  </div>
                )}

                {plan.id === "premium" && !isCurrent && (
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-semibold">
                    {language === "ar" ? "الأكثر شعبية" : "Most Popular"}
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

                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-semibold">
                      {language === "ar" ? "الحد الأقصى للمرضى:" : "Patient Limit:"} {" "}
                      {plan.maxPatients === -1 
                        ? (language === "ar" ? "غير محدود" : "Unlimited")
                        : plan.maxPatients
                      }
                    </p>
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

        {/* ROI Calculator */}
        <div className="mt-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            {language === "ar" ? "حاسبة العائد على الاستثمار" : "ROI Calculator"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">
                {language === "ar" ? "مرضى نشطون" : "Active Patients"}
              </p>
              <p className="text-2xl font-bold text-slate-800">{patientsConnected}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">
                {language === "ar" ? "متوسط الإيرادات الشهرية" : "Avg Monthly Revenue"}
              </p>
              <p className="text-2xl font-bold text-green-600">
                ${(patientsConnected * 5.99).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">
                {language === "ar" ? "صافي الربح" : "Net Profit"}
              </p>
              <p className="text-2xl font-bold text-teal-600">
                ${Math.max(0, (patientsConnected * 5.99) - (currentPlanData?.price || 0)).toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">
            {language === "ar"
              ? "* الحسابات تقديرية بناءً على متوسط اشتراك المريض $5.99/شهر"
              : "* Calculations are estimates based on average patient subscription of $5.99/month"}
          </p>
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
