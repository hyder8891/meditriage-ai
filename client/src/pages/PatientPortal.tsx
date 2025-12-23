import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain,
  Microscope,
  Activity,
  FileText,
  Search,
  Users,
  MessageSquare,
  Crown,
  TrendingUp,
  Calendar,
  Heart,
  Stethoscope,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Plus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { AppLogo } from "@/components/AppLogo";

export default function PatientPortal() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { data: usage } = trpc.b2b2c.subscription.getUsageStats.useQuery();
  const { data: myDoctors } = trpc.b2b2c.patient.getMyDoctors.useQuery();

  // Patient Tools - Removed clinical tools (X-Ray, Lab Interpretation)
  // Bio-Scanner (Optic-Vitals) is now available for patients
  const patientTools = [
    {
      icon: Heart,
      title: language === 'ar' ? 'قياس النبض' : 'Optic-Vitals',
      desc: language === 'ar' ? 'قياس معدل ضربات القلب بالكاميرا' : 'Measure heart rate with camera',
      color: 'from-red-500 to-rose-500',
      path: '/patient/bio-scanner',
    },
    {
      icon: Search,
      title: language === 'ar' ? 'ابحث عن عيادة' : 'Find Clinic',
      desc: language === 'ar' ? 'اعثر على أقرب مستشفى أو عيادة' : 'Find nearest hospital or clinic',
      color: 'from-blue-500 to-cyan-500',
      path: '/patient/care-locator',
    },
    {
      icon: FileText,
      title: language === 'ar' ? 'سجلاتي الطبية' : 'My Medical Records',
      desc: language === 'ar' ? 'عرض نتائج الفحوصات والتقارير' : 'View test results and reports',
      color: 'from-green-500 to-emerald-500',
      path: '/patient/medical-records',
    },
    {
      icon: Calendar,
      title: language === 'ar' ? 'مواعيدي' : 'My Appointments',
      desc: language === 'ar' ? 'إدارة المواعيد الطبية' : 'Manage medical appointments',
      color: 'from-purple-500 to-indigo-500',
      path: '/patient/appointments',
    },
  ];

  // Calculate usage percentage
  const usagePercentage = usage 
    ? (usage.consultationsUsed / usage.consultationsLimit) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Top Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <AppLogo href="/patient/portal" size="md" showText={true} />
              <div className="hidden md:flex items-center gap-1">
                <Button variant="ghost" className="text-rose-600 bg-rose-50">
                  <Activity className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                </Button>
                <Button variant="ghost" onClick={() => setLocation('/patient/find-doctors')}>
                  <Search className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'ابحث عن طبيب' : 'Find Doctors'}
                </Button>
                <Button variant="ghost" onClick={() => setLocation('/patient/my-doctors')}>
                  <Users className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'أطبائي' : 'My Doctors'}
                </Button>
                <Button variant="ghost" onClick={() => setLocation('/patient/messages')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'الرسائل' : 'Messages'}
                </Button>
                <Button variant="ghost" onClick={() => setLocation('/patient/subscription')}>
                  <Crown className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'الاشتراك' : 'Subscription'}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-rose-500 to-purple-500 text-white">
                {usage?.plan || 'Free'}
              </Badge>
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            {language === 'ar' ? 'مرحباً بك' : 'Welcome Back'}
          </h1>
          <p className="text-slate-600">
            {language === 'ar' 
              ? 'احصل على تقييم فوري أو تواصل مع أطبائك المختصين'
              : 'Get instant assessment or connect with your specialist doctors'}
          </p>
        </div>

        {/* Usage Stats Banner */}
        {usage && (
          <Card className="mb-8 border-2 border-rose-100 bg-gradient-to-r from-rose-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {language === 'ar' ? 'استخدام الاستشارات' : 'Consultation Usage'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {language === 'ar' 
                      ? `${usage.consultationsUsed} من ${usage.consultationsLimit} استشارة مستخدمة`
                      : `${usage.consultationsUsed} of ${usage.consultationsLimit} consultations used`}
                  </p>
                </div>
                {usagePercentage >= 80 && (
                  <Badge className="bg-orange-100 text-orange-700">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {language === 'ar' ? 'قريب من الحد' : 'Near Limit'}
                  </Badge>
                )}
              </div>
              <Progress value={usagePercentage} className="h-3 mb-4" />
              {usagePercentage >= 80 && (
                <Button 
                  size="sm" 
                  onClick={() => setLocation('/patient/subscription')}
                  className="bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'ترقية الخطة' : 'Upgrade Plan'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Start AI Assessment */}
          <Card className="border-2 hover:shadow-xl transition-all cursor-pointer group" onClick={() => setLocation('/symptom-checker')}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {language === 'ar' ? 'ابدأ التقييم الذكي' : 'Start AI Assessment'}
              </h3>
              <p className="text-slate-600 mb-4">
                {language === 'ar' 
                  ? 'احصل على تحليل فوري لأعراضك باستخدام الذكاء الاصطناعي'
                  : 'Get instant analysis of your symptoms using AI'}
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>{language === 'ar' ? 'أقل من 3 دقائق' : 'Less than 3 minutes'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Find Doctor */}
          <Card className="border-2 hover:shadow-xl transition-all cursor-pointer group" onClick={() => setLocation('/patient/find-doctors')}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {language === 'ar' ? 'ابحث عن طبيب' : 'Find a Doctor'}
              </h3>
              <p className="text-slate-600 mb-4">
                {language === 'ar' 
                  ? 'تصفح واختر من بين مئات الأطباء المعتمدين'
                  : 'Browse and choose from hundreds of certified doctors'}
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="w-4 h-4" />
                <span>{language === 'ar' ? '500+ طبيب متاح' : '500+ doctors available'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Doctors */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {language === 'ar' ? 'أطبائي' : 'My Doctors'}
                </CardTitle>
                <p className="text-slate-600 text-sm mt-1">
                  {language === 'ar' ? 'الأطباء المتصلون بك' : 'Your connected doctors'}
                </p>
              </div>
              <Button variant="outline" onClick={() => setLocation('/patient/my-doctors')}>
                {language === 'ar' ? 'عرض الكل' : 'View All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {myDoctors && myDoctors.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {myDoctors.slice(0, 3).map((connection: any) => (
                  <Card key={connection.id} className="border hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 truncate">
                            {connection.doctor?.name || language === 'ar' ? 'د. أحمد' : 'Dr. Ahmed'}
                          </h4>
                          <p className="text-sm text-slate-600 truncate">
                            {connection.doctor?.specialty || language === 'ar' ? 'طب عام' : 'General Medicine'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">4.9</span>
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          {language === 'ar' ? 'متاح' : 'Available'}
                        </Badge>
                      </div>
                      <Button size="sm" className="w-full" onClick={() => setLocation('/patient/messages')}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'إرسال رسالة' : 'Send Message'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  {language === 'ar' ? 'لا يوجد أطباء متصلون' : 'No Connected Doctors'}
                </h3>
                <p className="text-slate-600 mb-4">
                  {language === 'ar' 
                    ? 'ابحث عن طبيب وتواصل معه للحصول على استشارة'
                    : 'Find and connect with a doctor to get consultation'}
                </p>
                <Button onClick={() => setLocation('/patient/find-doctors')}>
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'ابحث عن طبيب' : 'Find Doctor'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Tools Grid */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {language === 'ar' ? 'أدواتي' : 'My Tools'}
                </CardTitle>
                <p className="text-slate-600 text-sm mt-1">
                  {language === 'ar' ? 'إدارة رعايتك الصحية' : 'Manage your healthcare'}
                </p>
              </div>
              <Zap className="w-6 h-6 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patientTools.map((tool, idx) => (
                <Card 
                  key={idx} 
                  className="border-2 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => setLocation(tool.path)}
                >
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <tool.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{tool.title}</h3>
                    <p className="text-sm text-slate-600">{tool.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">
              {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  icon: CheckCircle,
                  title: language === 'ar' ? 'تم إكمال التقييم' : 'Assessment Completed',
                  desc: language === 'ar' ? 'تقييم الأعراض - صداع وحمى' : 'Symptom assessment - Headache and fever',
                  time: language === 'ar' ? 'منذ ساعتين' : '2 hours ago',
                  color: 'text-green-600 bg-green-100',
                },
                {
                  icon: MessageSquare,
                  title: language === 'ar' ? 'رسالة جديدة' : 'New Message',
                  desc: language === 'ar' ? 'من د. أحمد الحسيني' : 'From Dr. Ahmed Al-Husseini',
                  time: language === 'ar' ? 'منذ 5 ساعات' : '5 hours ago',
                  color: 'text-blue-600 bg-blue-100',
                },
                {
                  icon: Calendar,
                  title: language === 'ar' ? 'موعد قادم' : 'Upcoming Appointment',
                  desc: language === 'ar' ? 'غداً الساعة 10:00 صباحاً' : 'Tomorrow at 10:00 AM',
                  time: language === 'ar' ? 'غداً' : 'Tomorrow',
                  color: 'text-purple-600 bg-purple-100',
                },
              ].map((activity) => (
                <div key={activity.title} className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full ${activity.color} flex items-center justify-center flex-shrink-0`}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{activity.title}</h4>
                    <p className="text-sm text-slate-600">{activity.desc}</p>
                  </div>
                  <span className="text-xs text-slate-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
