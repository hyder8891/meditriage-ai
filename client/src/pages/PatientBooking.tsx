import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { VoiceInput } from "@/components/VoiceInput";

interface PatientBookingProps {
  doctorId?: number;
  doctorName?: string;
}

export default function PatientBooking({ doctorId, doctorName }: PatientBookingProps) {
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    chiefComplaint: "",
    symptoms: "",
  });

  const startDate = format(selectedDate, "yyyy-MM-dd");
  const endDate = format(addDays(selectedDate, 7), "yyyy-MM-dd");

  // Queries
  const { data: availableSlots, refetch: refetchSlots } = trpc.calendar.getAvailableSlots.useQuery(
    {
      doctorId: doctorId || 0,
      startDate,
      endDate,
    },
    {
      enabled: !!doctorId,
    }
  );

  const { data: myRequests, refetch: refetchRequests } = trpc.calendar.getMyBookingRequests.useQuery();

  // Mutations
  const createBookingMutation = trpc.calendar.createBookingRequest.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم إرسال طلب الحجز بنجاح" : "Booking request sent successfully");
      setShowBookingDialog(false);
      setSelectedSlot(null);
      setBookingForm({ chiefComplaint: "", symptoms: "" });
      refetchSlots();
      refetchRequests();
    },
    onError: (error) => {
      toast.error(language === 'ar' ? `خطأ: ${error.message}` : `Error: ${error.message}`);
    },
  });

  const cancelRequestMutation = trpc.calendar.cancelBookingRequest.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم إلغاء طلب الحجز" : "Booking request cancelled");
      refetchRequests();
    },
    onError: (error) => {
      toast.error(language === 'ar' ? `خطأ: ${error.message}` : `Error: ${error.message}`);
    },
  });

  const handleSlotClick = (slot: any) => {
    setSelectedSlot(slot);
    setShowBookingDialog(true);
  };

  const handleBooking = () => {
    if (!selectedSlot) return;

    createBookingMutation.mutate({
      slotId: selectedSlot.id,
      chiefComplaint: bookingForm.chiefComplaint,
      symptoms: bookingForm.symptoms,
    });
  };

  const handleCancelRequest = (requestId: number) => {
    const confirmMessage = language === 'ar' 
      ? "هل أنت متأكد من إلغاء طلب الحجز؟"
      : "Are you sure you want to cancel this booking request?";
    if (confirm(confirmMessage)) {
      cancelRequestMutation.mutate({ requestId });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; variant: any; labelAr: string; labelEn: string }> = {
      pending: { icon: AlertCircle, variant: "default", labelAr: "قيد الانتظار", labelEn: "Pending" },
      confirmed: { icon: CheckCircle2, variant: "default", labelAr: "مؤكد", labelEn: "Confirmed" },
      rejected: { icon: XCircle, variant: "destructive", labelAr: "مرفوض", labelEn: "Rejected" },
      cancelled: { icon: XCircle, variant: "outline", labelAr: "ملغي", labelEn: "Cancelled" },
    };
    const config = statusConfig[status] || { 
      icon: AlertCircle, 
      variant: "default", 
      labelAr: status, 
      labelEn: status 
    };
    const Icon = config.icon;
    const label = language === 'ar' ? config.labelAr : config.labelEn;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const groupSlotsByDate = (slots: any[]) => {
    const grouped: Record<string, any[]> = {};
    slots.forEach((slot) => {
      const date = slot.slotDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });
    return grouped;
  };

  const isRTL = language === 'ar';
  const dateLocale = language === 'ar' ? ar : enUS;

  if (!doctorId) {
    return (
      <div className="container mx-auto py-12 text-center" dir={isRTL ? "rtl" : "ltr"}>
        <User className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          {language === 'ar' ? 'اختر طبيباً' : 'Select a Doctor'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'يرجى اختيار طبيب لعرض المواعيد المتاحة'
            : 'Please select a doctor to view available appointments'}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'حجز موعد' : 'Book Appointment'}
          </h1>
          {doctorName && (
            <p className="text-muted-foreground">
              {language === 'ar' ? `مع ${doctorName}` : `With ${doctorName}`}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="available" dir={isRTL ? "rtl" : "ltr"}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">
            {language === 'ar' ? 'المواعيد المتاحة' : 'Available Slots'}
          </TabsTrigger>
          <TabsTrigger value="my-requests">
            {language === 'ar' ? 'طلباتي' : 'My Requests'}
            {myRequests && myRequests.length > 0 && (
              <Badge variant="secondary" className={isRTL ? "mr-2" : "ml-2"}>
                {myRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {language === 'ar' ? 'المواعيد المتاحة' : 'Available Appointments'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'اختر الموعد المناسب لك' : 'Choose a suitable appointment time'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableSlots && availableSlots.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupSlotsByDate(availableSlots)).map(([date, slots]) => (
                    <div key={date} className="space-y-3">
                      <h3 className="font-semibold text-lg">
                        {format(new Date(date), "EEEE، d MMMM yyyy", { locale: dateLocale })}
                      </h3>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {slots.map((slot) => (
                          <Button
                            key={slot.id}
                            variant="outline"
                            className="h-auto py-3 flex flex-col items-center gap-1"
                            onClick={() => handleSlotClick(slot)}
                          >
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">
                              {slot.startTime.slice(0, 5)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لا توجد مواعيد متاحة حالياً' : 'No appointments available at the moment'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {language === 'ar' 
                      ? 'يرجى المحاولة لاحقاً أو اختيار تاريخ آخر'
                      : 'Please try again later or select another date'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-4">
          {myRequests && myRequests.length > 0 ? (
            myRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                      </div>
                      {request.chiefComplaint && (
                        <p className="text-sm">
                          <strong>{language === 'ar' ? 'الشكوى:' : 'Chief Complaint:'}</strong> {request.chiefComplaint}
                        </p>
                      )}
                      {request.symptoms && (
                        <p className="text-sm text-muted-foreground">
                          <strong>{language === 'ar' ? 'الأعراض:' : 'Symptoms:'}</strong> {request.symptoms}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'تاريخ الطلب: ' : 'Request Date: '}
                        {format(new Date(request.createdAt), "d MMMM yyyy، HH:mm", { locale: dateLocale })}
                      </p>
                      {request.status === "rejected" && request.rejectionReason && (
                        <div className="mt-2 p-3 bg-destructive/10 rounded-lg">
                          <p className="text-sm font-medium text-destructive">
                            {language === 'ar' ? 'سبب الرفض:' : 'Rejection Reason:'}
                          </p>
                          <p className="text-sm text-muted-foreground">{request.rejectionReason}</p>
                        </div>
                      )}
                      {request.status === "confirmed" && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            {language === 'ar' 
                              ? '✓ تم تأكيد موعدك بنجاح'
                              : '✓ Your appointment has been confirmed successfully'}
                          </p>
                        </div>
                      )}
                    </div>
                    {request.status === "pending" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={cancelRequestMutation.isPending}
                      >
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد طلبات حجز' : 'No booking requests'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'}
            </DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  {language === 'ar' ? 'الموعد: ' : 'Appointment: '}
                  {format(new Date(selectedSlot.slotDate), "EEEE، d MMMM yyyy", { locale: dateLocale })}
                  {" - "}
                  {selectedSlot.startTime.slice(0, 5)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                {language === 'ar' ? 'الشكوى الرئيسية' : 'Chief Complaint'}
              </Label>
              <div className="space-y-2">
                <Textarea
                  placeholder={language === 'ar' ? 'اذكر سبب الزيارة...' : 'Describe the reason for your visit...'}
                  value={bookingForm.chiefComplaint}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, chiefComplaint: e.target.value })
                  }
                  rows={3}
                />
                <VoiceInput
                  onTranscript={(text) =>
                    setBookingForm({
                      ...bookingForm,
                      chiefComplaint: bookingForm.chiefComplaint + (bookingForm.chiefComplaint ? " " : "") + text,
                    })
                  }
                  language={language === "ar" ? "ar-SA" : "en-US"}
                  placeholder={
                    language === "ar"
                      ? "انقر على الميكروفون لوصف سبب الزيارة"
                      : "Click microphone to describe reason for visit"
                  }
                />
              </div>
            </div>
            <div>
              <Label>
                {language === 'ar' ? 'الأعراض (اختياري)' : 'Symptoms (Optional)'}
              </Label>
              <div className="space-y-2">
                <Textarea
                  placeholder={language === 'ar' ? 'اذكر الأعراض التي تعاني منها...' : 'Describe your symptoms...'}
                  value={bookingForm.symptoms}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, symptoms: e.target.value })
                  }
                  rows={3}
                />
                <VoiceInput
                  onTranscript={(text) =>
                    setBookingForm({
                      ...bookingForm,
                      symptoms: bookingForm.symptoms + (bookingForm.symptoms ? " " : "") + text,
                    })
                  }
                  language={language === "ar" ? "ar-SA" : "en-US"}
                  placeholder={
                    language === "ar"
                      ? "انقر على الميكروفون لوصف الأعراض"
                      : "Click microphone to describe symptoms"
                  }
                />
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{language === 'ar' ? 'ملاحظة:' : 'Note:'}</strong>{' '}
                {language === 'ar'
                  ? 'سيتم إرسال طلب الحجز إلى الطبيب للمراجعة. ستتلقى إشعاراً عند تأكيد أو رفض الموعد.'
                  : 'Your booking request will be sent to the doctor for review. You will receive a notification when the appointment is confirmed or rejected.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBooking}
                disabled={createBookingMutation.isPending || !bookingForm.chiefComplaint}
                className="flex-1"
              >
                {createBookingMutation.isPending 
                  ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                  : (language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBookingDialog(false)}
                className="flex-1"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
