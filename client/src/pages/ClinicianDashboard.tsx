import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Activity, 
  Users, 
  AlertCircle, 
  Clock,
  Search,
  Plus,
  FileText,
  TrendingUp,
  LogOut,
  Menu,
  Mic,
  FileImage,
  Calendar,
  Pill,
  MessageSquare,
  Bell,
  Crown,
  DollarSign,
  Database
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { NotificationBadge } from "@/components/NotificationBadge";
import { useNotifications } from "@/contexts/NotificationContext";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { useLanguage } from "@/contexts/LanguageContext";

function UpcomingConsultations() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { data: consultations, isLoading } = trpc.consultation.getMy.useQuery();

  const upcomingConsultations = consultations?.filter(
    c => c.status === 'scheduled' || c.status === 'waiting'
  ).slice(0, 3) || [];

  if (isLoading) {
    return (
      <Card className="card-modern mb-6">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            {language === 'ar' ? 'الاستشارات القادمة' : 'Upcoming Consultations'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="text-center py-4 text-gray-500">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (upcomingConsultations.length === 0) {
    return null;
  }

  return (
    <Card className="card-modern mb-6">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl">
              {language === 'ar' ? 'الاستشارات القادمة' : 'Upcoming Consultations'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {language === 'ar' ? 'استشارات الفيديو المجدولة' : 'Scheduled video consultations'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/clinician/consultations')}
          >
            {language === 'ar' ? 'عرض الكل' : 'View All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="space-y-3">
          {upcomingConsultations.map((consultation) => {
            const scheduledDate = new Date(consultation.scheduledTime);
            const patientInfo = 'patient' in consultation ? consultation.patient : null;
            const patientName = patientInfo?.name || (language === 'ar' ? 'مريض غير معروف' : 'Unknown Patient');

            return (
              <div
                key={consultation.id}
                className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                onClick={() => setLocation(`/consultation/${consultation.id}`)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{patientName}</h4>
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        {consultation.status === 'scheduled' 
                          ? (language === 'ar' ? 'مجدول' : 'Scheduled')
                          : (language === 'ar' ? 'قيد الانتظار' : 'Waiting')
                        }
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {scheduledDate.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {scheduledDate.toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {consultation.chiefComplaint && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {consultation.chiefComplaint}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="outline">
                    {language === 'ar' ? 'انضم' : 'Join'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ClinicianDashboardContent() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const authLoading = false; // Zustand auth is synchronous
  const { requestPermission, hasPermission } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Request notification permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      setLocation("/clinician/login");
    },
  });

  const { data: cases, isLoading: casesLoading } = trpc.clinical.getAllCases.useQuery();
  const { data: unreadCount } = trpc.clinical.getUnreadMessageCount.useQuery(
    { recipientId: user?.id || 0 },
    { enabled: !!user?.id, refetchInterval: 10000 } // Refetch every 10 seconds
  );

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleNewCase = () => {
    // Navigate to Clinical Reasoning to create a new case
    setLocation("/clinician/reasoning");
  };

  // Redirect if not authenticated or not a clinician/admin
  if (!authLoading && (!user || (user.role !== 'clinician' && user.role !== 'admin'))) {
    setLocation("/clinician/login");
    return null;
  }

  const activeCases = cases?.filter((c: any) => c.status === "active") || [];
  const emergencyCases = activeCases.filter((c: any) => c.urgency === "emergency");
  const urgentCases = activeCases.filter((c: any) => c.urgency === "urgent");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {language === 'ar' 
                ? `مرحباً، د. ${user?.name || "الطبيب"}`
                : `Welcome back, Dr. ${user?.name || "Clinician"}`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBadge />
            <Button onClick={handleNewCase} className="bg-blue-600 hover:bg-blue-700 min-h-[44px]" size="sm">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'ar' ? 'حالة جديدة' : 'New Case'}</span>
              <span className="sm:hidden">{language === 'ar' ? 'جديد' : 'New'}</span>
            </Button>
          </div>
        </div>
      </header>


      {/* Stats Cards */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <Card className="card-modern">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                {language === 'ar' ? 'الحالات النشطة' : 'Active Cases'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{activeCases.length}</div>
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern border-red-200 bg-red-50">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-red-700">
                {language === 'ar' ? 'طوارئ' : 'Emergency'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold text-red-700">{emergencyCases.length}</div>
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern border-orange-200 bg-orange-50">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-700">
                {language === 'ar' ? 'عاجل' : 'Urgent'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold text-orange-700">{urgentCases.length}</div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                {language === 'ar' ? 'إجمالي المرضى' : 'Total Patients'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{cases?.length || 0}</div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Consultations */}
        <UpcomingConsultations />

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={language === 'ar' ? 'ابحث عن المرضى...' : 'Search patients...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-11 text-sm sm:text-base h-9 sm:h-10"
            />
          </div>
        </div>

        {/* Cases List */}
        <Card className="card-modern">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">
              {language === 'ar' ? 'الحالات الأخيرة' : 'Recent Cases'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {language === 'ar' ? 'إدارة حالات المرضى' : 'Manage your patient cases'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {casesLoading ? (
              <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading cases...'}
              </div>
            ) : activeCases.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">
                  {language === 'ar' ? 'لا توجد حالات نشطة' : 'No active cases'}
                </p>
                <Button onClick={handleNewCase} size="sm" className="min-h-[44px] text-base md:text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  {language === 'ar' ? 'إنشاء أول حالة' : 'Create First Case'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {activeCases
                  .filter((c: any) => 
                    searchQuery === "" || 
                    c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((caseItem: any) => (
                    <div
                      key={caseItem.id}
                      className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 active:scale-[0.98] transition-all cursor-pointer"
                      onClick={() => setLocation(`/clinician/case/${caseItem.id}/timeline`)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{caseItem.patientName}</h3>
                            {caseItem.urgency && (
                              <Badge
                                className={`text-xs ${
                                  caseItem.urgency === "emergency"
                                    ? "bg-red-100 text-red-700"
                                    : caseItem.urgency === "urgent"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {caseItem.urgency}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1 line-clamp-1">{caseItem.chiefComplaint}</p>
                          <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 flex-wrap">
                            {caseItem.patientAge && <span>{language === 'ar' ? 'العمر' : 'Age'}: {caseItem.patientAge}</span>}
                            {caseItem.patientGender && <span>{language === 'ar' ? 'الجنس' : 'Gender'}: {caseItem.patientGender}</span>}
                            <span className="hidden sm:inline">{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="hidden sm:flex flex-shrink-0 min-h-[40px]">
                          {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ClinicianDashboard() {
  return (
    <ClinicianLayout>
      <ClinicianDashboardContent />
    </ClinicianLayout>
  );
}
