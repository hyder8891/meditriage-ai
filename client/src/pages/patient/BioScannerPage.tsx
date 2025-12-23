import { useState } from "react";
import { BioScanner } from "@/components/BioScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import type { HeartRateResult } from "@/lib/rppg-engine";
import { VitalsTrendsChart } from "@/components/VitalsTrendsChart";

export default function BioScannerPage() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [lastResult, setLastResult] = useState<HeartRateResult | null>(null);

  const { data: stats, refetch: refetchStats } = trpc.vitals.getStats.useQuery();
  const { data: recentVitals, refetch: refetchRecent } = trpc.vitals.getRecent.useQuery({ limit: 5 });

  const handleScanComplete = (result: HeartRateResult) => {
    setLastResult(result);
    // Refetch stats and recent vitals after successful scan
    setTimeout(() => {
      refetchStats();
      refetchRecent();
    }, 1000);
  };

  const getHeartRateStatus = (bpm: number) => {
    if (bpm < 60) return { label: language === 'ar' ? 'منخفض' : 'Low', color: 'text-blue-600 bg-blue-100' };
    if (bpm > 100) return { label: language === 'ar' ? 'مرتفع' : 'High', color: 'text-red-600 bg-red-100' };
    return { label: language === 'ar' ? 'طبيعي' : 'Normal', color: 'text-green-600 bg-green-100' };
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-IQ' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Top Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/patient/portal')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'رجوع' : 'Back'}
              </Button>
              <AppLogo href="/patient/portal" size="md" showText={true} />
            </div>
            <UserProfileDropdown />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            {language === 'ar' ? 'قياس النبض بالكاميرا' : 'Optic-Vitals Bio-Scanner'}
          </h1>
          <p className="text-slate-600">
            {language === 'ar' 
              ? 'قياس معدل ضربات القلب باستخدام كاميرا الهاتف - تقنية rPPG'
              : 'Measure your heart rate using your phone camera - rPPG technology'}
          </p>
        </div>

        <div className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Scanner Section */}
          <div className="lg:col-span-2">
            <BioScanner 
              onComplete={handleScanComplete}
              measurementDuration={15}
            />

            {/* Last Result */}
            {lastResult && (
              <Card className="mt-6 border-2 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 mb-1">
                        {language === 'ar' ? 'تم القياس بنجاح!' : 'Measurement Complete!'}
                      </h3>
                      <p className="text-sm text-green-700 mb-3">
                        {language === 'ar' 
                          ? `معدل النبض: ${lastResult.bpm} نبضة/دقيقة`
                          : `Heart Rate: ${lastResult.bpm} BPM`}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <Badge className={getHeartRateStatus(lastResult.bpm).color}>
                          {getHeartRateStatus(lastResult.bpm).label}
                        </Badge>
                        <span className="text-green-700">
                          {language === 'ar' ? 'الدقة:' : 'Confidence:'} {lastResult.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How It Works */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl">
                  {language === 'ar' ? 'كيف يعمل؟' : 'How It Works'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>
                  {language === 'ar'
                    ? 'تستخدم هذه التقنية كاميرا هاتفك لقياس التغيرات الدقيقة في لون بشرتك الناتجة عن تدفق الدم.'
                    : 'This technology uses your phone camera to detect subtle color changes in your skin caused by blood flow.'}
                </p>
                <p>
                  {language === 'ar'
                    ? 'عندما ينبض قلبك، يزداد حجم الدم في الأوعية الدموية تحت الجلد، مما يسبب تغيرات طفيفة في اللون الأخضر.'
                    : 'When your heart beats, blood volume in vessels under your skin increases, causing subtle changes in green color.'}
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {language === 'ar' ? 'للحصول على أفضل النتائج:' : 'For Best Results:'}
                  </h4>
                  <ul className="space-y-1 text-blue-800 dark:text-blue-300 text-sm">
                    <li>• {language === 'ar' ? 'استخدم إضاءة جيدة (ضوء طبيعي أفضل)' : 'Use good lighting (natural light is best)'}</li>
                    <li>• {language === 'ar' ? 'ابق ثابتاً أثناء القياس' : 'Stay still during measurement'}</li>
                    <li>• {language === 'ar' ? 'ضع وجهك في إطار الكاميرا' : 'Keep your face in the camera frame'}</li>
                    <li>• {language === 'ar' ? 'تجنب الحركة الزائدة' : 'Avoid excessive movement'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats & History Sidebar */}
          <div className="space-y-6">
            {/* Statistics Card */}
            {stats && stats.totalReadings > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">
                      {language === 'ar' ? 'المتوسط' : 'Average'}
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                      {stats.avgHeartRate || '--'}
                      <span className="text-lg text-slate-600 ml-1">BPM</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        {language === 'ar' ? 'الأدنى' : 'Lowest'}
                      </div>
                      <div className="text-xl font-semibold text-blue-600">
                        {stats.avgHeartRate ? Math.round(stats.avgHeartRate * 0.85) : '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {language === 'ar' ? 'الأعلى' : 'Highest'}
                      </div>
                      <div className="text-xl font-semibold text-red-600">
                        {stats.avgHeartRate ? Math.round(stats.avgHeartRate * 1.15) : '--'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-600 mb-2">
                      {language === 'ar' ? 'متوسط التوتر' : 'Avg Stress'}
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {stats.avgStress}/100
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-xs text-slate-600">
                      {language === 'ar' ? 'إجمالي القياسات' : 'Total Measurements'}
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {stats.totalReadings}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Measurements */}
            {recentVitals && recentVitals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {language === 'ar' ? 'القياسات الأخيرة' : 'Recent Measurements'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentVitals.map((vital) => (
                      <div key={vital.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Heart className="w-5 h-5 text-red-500" />
                          <div>
                            <div className="font-semibold text-slate-900">
                              {vital.heartRate} BPM
                            </div>
                            <div className="text-xs text-slate-600">
                              {formatDate(vital.createdAt)}
                            </div>
                          </div>
                        </div>
                        <Badge className={getHeartRateStatus(vital.heartRate || 0).color}>
                          {getHeartRateStatus(vital.heartRate || 0).label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {(!stats || stats.totalReadings === 0) && (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {language === 'ar' ? 'لا توجد قياسات بعد' : 'No Measurements Yet'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {language === 'ar' 
                      ? 'ابدأ أول قياس لك لرؤية الإحصائيات'
                      : 'Start your first measurement to see statistics'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Trends Chart - Full Width Below */}
        {stats && stats.totalReadings > 0 && recentVitals && recentVitals.length > 0 && (
          <VitalsTrendsChart 
            vitals={recentVitals}
            title={language === 'ar' ? 'اتجاهات القياسات' : 'Vital Signs Trends'}
            description={language === 'ar' ? 'تتبع معدل ضربات القلب ومقاييس HRV بمرور الوقت' : 'Track heart rate and HRV metrics over time'}
          />
        )}
        </div>
      </div>
    </div>
  );
}
