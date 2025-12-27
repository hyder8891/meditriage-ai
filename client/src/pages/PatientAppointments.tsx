import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Video, Phone, Plus, CheckCircle, XCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AppLogo } from "@/components/AppLogo";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";

export default function PatientAppointments() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // Fetch consultations from backend
  const { data: consultations, isLoading } = trpc.consultation.getMy.useQuery();
  const utils = trpc.useUtils();
  
  const cancelMutation = trpc.consultation.cancel.useMutation({
    onSuccess: () => {
      utils.consultation.getMy.invalidate();
      toast.success(language === 'ar' ? 'تم إلغاء الموعد بنجاح' : 'Consultation cancelled successfully');
    },
    onError: (error) => {
      toast.error(language === 'ar' ? 'فشل إلغاء الموعد' : 'Failed to cancel consultation', {
        description: error.message,
      });
    },
  });

  // Socket.IO for real-time consultation updates
  useEffect(() => {
    if (!user) return;

    // Connect to Socket.IO server
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[PatientAppointments] Socket connected:', socket.id);
      // Register user for receiving consultation updates
      socket.emit('register-user', { userId: user.id });
    });

    socket.on('connect_error', (error) => {
      console.error('[PatientAppointments] Socket connection error:', error);
    });

    // Listen for consultation status updates
    socket.on(`user:${user.id}:consultation-update`, (data) => {
      console.log('[PatientAppointments] Consultation update received:', data);
      
      // Invalidate queries to refresh UI
      utils.consultation.getMy.invalidate();
      
      // Show notification based on status
      if (data.status === 'in_progress') {
        toast.success(
          language === 'ar' ? 'الطبيب انضم إلى المكالمة!' : 'Doctor joined the call!',
          {
            description: language === 'ar' 
              ? 'انقر على "انضم الآن" للدخول إلى الاستشارة'
              : 'Click "Join Now" to enter the consultation',
            duration: 10000,
            action: {
              label: language === 'ar' ? 'انضم' : 'Join',
              onClick: () => setLocation(`/consultation/${data.consultationId}`),
            },
          }
        );
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unregister-user', { userId: user.id });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, utils, language, setLocation]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'مجدول' : 'Scheduled'}
          </Badge>
        );
      case 'waiting':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'قيد الانتظار' : 'Waiting'}
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'جاري' : 'In Progress'}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'ملغى' : 'Cancelled'}
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'مكتمل' : 'Completed'}
          </Badge>
        );
      case 'no_show':
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            <XCircle className="w-3 h-3 mr-1" />
            {language === 'ar' ? 'لم يحضر' : 'No Show'}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header with consistent logo */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/patient/portal')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {language === 'ar' ? 'رجوع' : 'Back'}
              </Button>
              <AppLogo href="/patient/portal" size="md" showText={true} />
              <h1 className="text-xl font-semibold text-gray-800 hidden md:block">
                {language === 'ar' ? 'مواعيدي' : 'My Appointments'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setLocation('/patient/find-doctors')} className="hidden sm:flex">
                <Plus className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'موعد جديد' : 'New Appointment'}
              </Button>
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Appointments List */}
        {!isLoading && consultations && consultations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {language === 'ar' ? 'المواعيد القادمة' : 'Upcoming Appointments'}
            </h2>
            <div className="grid gap-4">
              {consultations.map((consultation) => {
                const scheduledDate = new Date(consultation.scheduledTime);
                const doctorInfo = 'doctor' in consultation ? consultation.doctor : null;
                const doctorName = doctorInfo?.name || (language === 'ar' ? 'طبيب غير معروف' : 'Unknown Doctor');
                const specialty = doctorInfo?.specialty || (language === 'ar' ? 'طب عام' : 'General Medicine');
                
                return (
                  <Card key={consultation.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                            {doctorName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900">{doctorName}</h3>
                              {getStatusBadge(consultation.status)}
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{specialty}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-slate-700">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span>{scheduledDate.toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-700">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span>{scheduledDate.toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-700">
                                <Video className="w-4 h-4 text-slate-400" />
                                <span>{language === 'ar' ? 'استشارة عبر الفيديو' : 'Video Consultation'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {(consultation.status === 'scheduled' || consultation.status === 'waiting' || consultation.status === 'in_progress') && (
                            <Button 
                              size="sm" 
                              onClick={() => setLocation(`/consultation/${consultation.id}`)}
                              className={consultation.status === 'in_progress' ? 'bg-green-600 hover:bg-green-700 animate-pulse' : ''}
                            >
                              <Video className="w-4 h-4 mr-2" />
                              {consultation.status === 'in_progress' 
                                ? (language === 'ar' ? 'انضم الآن' : 'Join Now')
                                : (language === 'ar' ? 'انضم' : 'Join')}
                            </Button>
                          )}
                          {(consultation.status === 'scheduled' || consultation.status === 'waiting') && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => cancelMutation.mutate({ consultationId: consultation.id })}
                              disabled={cancelMutation.isPending}
                            >
                              {cancelMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                language === 'ar' ? 'إلغاء' : 'Cancel'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!consultations || consultations.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {language === 'ar' ? 'لا توجد مواعيد' : 'No Appointments'}
              </h3>
              <p className="text-slate-600 mb-4">
                {language === 'ar' ? 'ليس لديك أي مواعيد قادمة' : "You don't have any upcoming appointments"}
              </p>
              <Button onClick={() => setLocation('/patient/find-doctors')}>
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
