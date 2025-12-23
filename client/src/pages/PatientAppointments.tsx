import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Video, Phone, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function PatientAppointments() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  // Mock appointments data - replace with real tRPC query when backend is ready
  const appointments = [
    {
      id: 1,
      doctorName: language === 'ar' ? 'د. أحمد محمد' : 'Dr. Ahmed Mohamed',
      specialty: language === 'ar' ? 'طبيب عام' : 'General Practitioner',
      date: '2025-01-15',
      time: '10:00 AM',
      type: 'video' as const,
      status: 'confirmed' as const,
      location: language === 'ar' ? 'استشارة عبر الفيديو' : 'Video Consultation',
    },
    {
      id: 2,
      doctorName: language === 'ar' ? 'د. فاطمة علي' : 'Dr. Fatima Ali',
      specialty: language === 'ar' ? 'طبيب قلب' : 'Cardiologist',
      date: '2025-01-20',
      time: '2:30 PM',
      type: 'in-person' as const,
      status: 'pending' as const,
      location: language === 'ar' ? 'عيادة القلب - الطابق الثالث' : 'Cardiology Clinic - 3rd Floor',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'مؤكد' : 'Confirmed'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'ملغى' : 'Cancelled'}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/patient/portal')}
              >
                {language === 'ar' ? '← رجوع' : '← Back'}
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {language === 'ar' ? 'مواعيدي' : 'My Appointments'}
                </h1>
                <p className="text-sm text-slate-600">
                  {language === 'ar' ? 'إدارة المواعيد الطبية' : 'Manage your medical appointments'}
                </p>
              </div>
            </div>
            <Button onClick={() => toast.info(language === 'ar' ? 'قريباً: حجز موعد جديد' : 'Coming soon: Book new appointment')}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'ar' ? 'موعد جديد' : 'New Appointment'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Upcoming Appointments */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            {language === 'ar' ? 'المواعيد القادمة' : 'Upcoming Appointments'}
          </h2>
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                        {appointment.doctorName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{appointment.doctorName}</h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{appointment.specialty}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{appointment.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{appointment.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700">
                            {appointment.type === 'video' ? (
                              <Video className="w-4 h-4 text-slate-400" />
                            ) : (
                              <MapPin className="w-4 h-4 text-slate-400" />
                            )}
                            <span>{appointment.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {appointment.type === 'video' && appointment.status === 'confirmed' && (
                        <Button size="sm" onClick={() => toast.info(language === 'ar' ? 'قريباً: الانضمام للمكالمة' : 'Coming soon: Join video call')}>
                          <Video className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'انضم' : 'Join'}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => toast.info(language === 'ar' ? 'قريباً: إعادة الجدولة' : 'Coming soon: Reschedule')}>
                        {language === 'ar' ? 'إعادة جدولة' : 'Reschedule'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toast.info(language === 'ar' ? 'قريباً: إلغاء الموعد' : 'Coming soon: Cancel appointment')}>
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {appointments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {language === 'ar' ? 'لا توجد مواعيد' : 'No Appointments'}
              </h3>
              <p className="text-slate-600 mb-4">
                {language === 'ar' ? 'ليس لديك أي مواعيد قادمة' : "You don't have any upcoming appointments"}
              </p>
              <Button onClick={() => toast.info(language === 'ar' ? 'قريباً: حجز موعد' : 'Coming soon: Book appointment')}>
                <Plus className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'احجز موعدك الأول' : 'Book Your First Appointment'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation('/patient/find-doctors')}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                {language === 'ar' ? 'ابحث عن طبيب' : 'Find a Doctor'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                {language === 'ar' ? 'ابحث عن طبيب واحجز موعد' : 'Search for a doctor and book an appointment'}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation('/patient/care-locator')}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                {language === 'ar' ? 'ابحث عن عيادة' : 'Find a Clinic'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                {language === 'ar' ? 'اعثر على أقرب عيادة أو مستشفى' : 'Find the nearest clinic or hospital'}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation('/patient/messages')}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-600" />
                {language === 'ar' ? 'تواصل مع طبيبك' : 'Contact Your Doctor'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                {language === 'ar' ? 'أرسل رسالة أو اتصل بطبيبك' : 'Send a message or call your doctor'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
