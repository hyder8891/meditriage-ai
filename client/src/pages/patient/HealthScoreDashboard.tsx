import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity,
  Heart,
  Brain,
  Dumbbell,
  Moon,
  Apple,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  Calendar,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PatientLayout } from "@/components/PatientLayout";

function HealthScoreDashboardContent() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [isCalculating, setIsCalculating] = useState(false);

  // Queries
  const vitalsQuery = trpc.vitals.getRecent.useQuery({ limit: 7 });
  const labSummaryQuery = trpc.lab.getDashboardSummary.useQuery();
  const medsQuery = trpc.pharmaguard.getMyMedications.useQuery({ activeOnly: true });

  // Calculate health score based on available data
  const calculateHealthScore = () => {
    let score = 70; // Base score
    let factors: { name: string; impact: number; status: 'good' | 'warning' | 'critical' }[] = [];

    // Vitals contribution
    if (vitalsQuery.data && vitalsQuery.data.length > 0) {
      const latestVitals = vitalsQuery.data[0];
      if (latestVitals.heartRate && latestVitals.heartRate >= 60 && latestVitals.heartRate <= 100) {
        score += 5;
        factors.push({ name: language === 'ar' ? 'معدل ضربات القلب' : 'Heart Rate', impact: 5, status: 'good' });
      } else {
        score -= 5;
        factors.push({ name: language === 'ar' ? 'معدل ضربات القلب' : 'Heart Rate', impact: -5, status: 'warning' });
      }
      
      if (latestVitals.oxygenSaturation && latestVitals.oxygenSaturation >= 95) {
        score += 5;
        factors.push({ name: language === 'ar' ? 'أكسجين الدم' : 'Blood Oxygen', impact: 5, status: 'good' });
      }
    }

    // Lab results contribution
    if (labSummaryQuery.data) {
      if (labSummaryQuery.data.criticalCount === 0) {
        score += 10;
        factors.push({ name: language === 'ar' ? 'نتائج الفحوصات' : 'Lab Results', impact: 10, status: 'good' });
      } else if (labSummaryQuery.data.criticalCount > 0) {
        score -= 15;
        factors.push({ name: language === 'ar' ? 'نتائج الفحوصات' : 'Lab Results', impact: -15, status: 'critical' });
      }
    }

    // Medication adherence (simplified)
    if (medsQuery.data && medsQuery.data.length > 0) {
      score += 5;
      factors.push({ name: language === 'ar' ? 'إدارة الأدوية' : 'Medication Management', impact: 5, status: 'good' });
    }

    return { score: Math.min(100, Math.max(0, score)), factors };
  };

  const { score: healthScore, factors: healthFactors } = calculateHealthScore();

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  // Get score background
  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-amber-500";
    if (score >= 40) return "from-orange-500 to-red-400";
    return "from-red-500 to-red-600";
  };

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= 80) return language === 'ar' ? 'ممتاز' : 'Excellent';
    if (score >= 60) return language === 'ar' ? 'جيد' : 'Good';
    if (score >= 40) return language === 'ar' ? 'متوسط' : 'Fair';
    return language === 'ar' ? 'يحتاج تحسين' : 'Needs Improvement';
  };

  // Health categories
  const healthCategories = [
    {
      id: "vitals",
      icon: Heart,
      title: language === 'ar' ? 'العلامات الحيوية' : 'Vitals',
      score: vitalsQuery.data?.length ? 85 : 0,
      status: vitalsQuery.data?.length ? 'good' : 'unknown',
      lastUpdate: vitalsQuery.data?.[0]?.createdAt,
      action: () => setLocation('/patient/bio-scanner'),
    },
    {
      id: "labs",
      icon: Activity,
      title: language === 'ar' ? 'الفحوصات' : 'Lab Results',
      score: labSummaryQuery.data?.criticalCount === 0 ? 90 : 60,
      status: labSummaryQuery.data?.criticalCount === 0 ? 'good' : 'warning',
      lastUpdate: labSummaryQuery.data?.latestReport?.reportDate,
      action: () => setLocation('/patient/lab-results'),
    },
    {
      id: "medications",
      icon: Droplets,
      title: language === 'ar' ? 'الأدوية' : 'Medications',
      score: medsQuery.data?.length ? 80 : 70,
      status: 'good',
      action: () => setLocation('/patient/medications'),
    },
    {
      id: "activity",
      icon: Dumbbell,
      title: language === 'ar' ? 'النشاط البدني' : 'Physical Activity',
      score: 65,
      status: 'warning',
      action: () => toast.info(language === 'ar' ? 'قريباً' : 'Coming soon'),
    },
    {
      id: "sleep",
      icon: Moon,
      title: language === 'ar' ? 'النوم' : 'Sleep',
      score: 70,
      status: 'good',
      action: () => toast.info(language === 'ar' ? 'قريباً' : 'Coming soon'),
    },
    {
      id: "nutrition",
      icon: Apple,
      title: language === 'ar' ? 'التغذية' : 'Nutrition',
      score: 75,
      status: 'good',
      action: () => toast.info(language === 'ar' ? 'قريباً' : 'Coming soon'),
    },
  ];

  // Goals
  const healthGoals = [
    {
      id: "steps",
      title: language === 'ar' ? 'خطوات يومية' : 'Daily Steps',
      current: 6500,
      target: 10000,
      unit: language === 'ar' ? 'خطوة' : 'steps',
      icon: Dumbbell,
    },
    {
      id: "water",
      title: language === 'ar' ? 'شرب الماء' : 'Water Intake',
      current: 6,
      target: 8,
      unit: language === 'ar' ? 'أكواب' : 'glasses',
      icon: Droplets,
    },
    {
      id: "sleep",
      title: language === 'ar' ? 'ساعات النوم' : 'Sleep Hours',
      current: 7,
      target: 8,
      unit: language === 'ar' ? 'ساعات' : 'hours',
      icon: Moon,
    },
  ];

  // Recommendations
  const recommendations = [
    {
      icon: Heart,
      title: language === 'ar' ? 'قياس الضغط' : 'Check Blood Pressure',
      desc: language === 'ar' ? 'لم تقس ضغطك منذ أسبوع' : 'You haven\'t measured your BP in a week',
      action: () => setLocation('/patient/bio-scanner'),
      priority: 'high',
    },
    {
      icon: Activity,
      title: language === 'ar' ? 'رفع فحوصات' : 'Upload Lab Results',
      desc: language === 'ar' ? 'احصل على تحليل لنتائجك' : 'Get analysis of your results',
      action: () => setLocation('/patient/lab-results'),
      priority: 'medium',
    },
    {
      icon: Dumbbell,
      title: language === 'ar' ? 'زيادة النشاط' : 'Increase Activity',
      desc: language === 'ar' ? 'حاول المشي 30 دقيقة يومياً' : 'Try walking 30 minutes daily',
      action: () => {},
      priority: 'low',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {language === 'ar' ? 'لوحة الصحة' : 'Health Score Dashboard'}
          </h1>
          <p className="text-slate-600 mt-1">
            {language === 'ar' 
              ? 'تتبع صحتك العامة في مكان واحد'
              : 'Track your overall health in one place'}
          </p>
        </div>
        <Target className="w-10 h-10 text-rose-500" />
      </div>

      {/* Main Score Card */}
      <Card className={`bg-gradient-to-br ${getScoreBg(healthScore)} text-white overflow-hidden`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">
                {language === 'ar' ? 'نقاط صحتك' : 'Your Health Score'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{healthScore}</span>
                <span className="text-2xl text-white/80">/100</span>
              </div>
              <Badge className="mt-2 bg-white/20 text-white border-0">
                {getScoreLabel(healthScore)}
              </Badge>
            </div>
            <div className="w-32 h-32 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="white"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(healthScore / 100) * 352} 352`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Award className="w-10 h-10 text-white/80" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Factors */}
      {healthFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-rose-500" />
              {language === 'ar' ? 'عوامل التقييم' : 'Score Factors'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthFactors.map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {factor.status === 'good' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : factor.status === 'critical' ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-slate-700">{factor.name}</span>
                  </div>
                  <Badge className={
                    factor.impact > 0 ? 'bg-green-100 text-green-800' :
                    factor.impact < 0 ? 'bg-red-100 text-red-800' :
                    'bg-slate-100 text-slate-800'
                  }>
                    {factor.impact > 0 ? '+' : ''}{factor.impact}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-rose-500" />
            {language === 'ar' ? 'فئات الصحة' : 'Health Categories'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {healthCategories.map((category) => (
              <div
                key={category.id}
                onClick={category.action}
                className="p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    category.status === 'good' ? 'bg-green-100' :
                    category.status === 'warning' ? 'bg-yellow-100' :
                    'bg-slate-200'
                  }`}>
                    <category.icon className={`w-5 h-5 ${
                      category.status === 'good' ? 'text-green-600' :
                      category.status === 'warning' ? 'text-yellow-600' :
                      'text-slate-500'
                    }`} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="font-medium text-slate-900 mb-1">{category.title}</h4>
                <div className="flex items-center gap-2">
                  <Progress value={category.score} className="h-2 flex-1" />
                  <span className="text-sm font-medium text-slate-600">{category.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-rose-500" />
            {language === 'ar' ? 'أهداف اليوم' : 'Today\'s Goals'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthGoals.map((goal) => {
              const progress = (goal.current / goal.target) * 100;
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <goal.icon className="w-4 h-4 text-rose-500" />
                      <span className="font-medium text-slate-700">{goal.title}</span>
                    </div>
                    <span className="text-sm text-slate-600">
                      {goal.current} / {goal.target} {goal.unit}
                    </span>
                  </div>
                  <Progress value={Math.min(100, progress)} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-rose-500" />
            {language === 'ar' ? 'توصيات لك' : 'Recommendations for You'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                onClick={rec.action}
                className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors ${
                  rec.priority === 'high' ? 'bg-red-50 hover:bg-red-100' :
                  rec.priority === 'medium' ? 'bg-yellow-50 hover:bg-yellow-100' :
                  'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  rec.priority === 'high' ? 'bg-red-100' :
                  rec.priority === 'medium' ? 'bg-yellow-100' :
                  'bg-slate-200'
                }`}>
                  <rec.icon className={`w-5 h-5 ${
                    rec.priority === 'high' ? 'text-red-600' :
                    rec.priority === 'medium' ? 'text-yellow-600' :
                    'text-slate-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{rec.title}</h4>
                  <p className="text-sm text-slate-600">{rec.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">
                {language === 'ar' ? 'كيف يُحسب التقييم؟' : 'How is the score calculated?'}
              </p>
              <p>
                {language === 'ar' 
                  ? 'يعتمد تقييم صحتك على بياناتك الفعلية: العلامات الحيوية، نتائج الفحوصات، وإدارة الأدوية. كلما أضفت بيانات أكثر، أصبح التقييم أدق.'
                  : 'Your health score is based on your actual data: vitals, lab results, and medication management. The more data you add, the more accurate your score becomes.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HealthScoreDashboard() {
  return (
    <PatientLayout>
      <HealthScoreDashboardContent />
    </PatientLayout>
  );
}
