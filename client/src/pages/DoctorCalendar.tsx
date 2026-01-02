import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Plus, Settings, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";

const DAYS_OF_WEEK = [
  { value: 0, label: "الأحد", labelEn: "Sunday" },
  { value: 1, label: "الاثنين", labelEn: "Monday" },
  { value: 2, label: "الثلاثاء", labelEn: "Tuesday" },
  { value: 3, label: "الأربعاء", labelEn: "Wednesday" },
  { value: 4, label: "الخميس", labelEn: "Thursday" },
  { value: 5, label: "الجمعة", labelEn: "Friday" },
  { value: 6, label: "السبت", labelEn: "Saturday" },
];

const SLOT_DURATIONS = [
  { value: 15, label: "15 دقيقة", labelEn: "15 minutes" },
  { value: 30, label: "30 دقيقة", labelEn: "30 minutes" },
  { value: 45, label: "45 دقيقة", labelEn: "45 minutes" },
  { value: 60, label: "60 دقيقة", labelEn: "60 minutes" },
];

function DoctorCalendarContent() {
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showWorkingHoursDialog, setShowWorkingHoursDialog] = useState(false);
  const [workingHoursForm, setWorkingHoursForm] = useState({
    dayOfWeek: 0,
    startTime: "09:00:00",
    endTime: "17:00:00",
    slotDuration: 30,
    bufferTime: 0,
  });

  const startDate = format(startOfWeek(selectedDate, { weekStartsOn: 0 }), "yyyy-MM-dd");
  const endDate = format(endOfWeek(selectedDate, { weekStartsOn: 0 }), "yyyy-MM-dd");

  // Queries
  const { data: workingHours, refetch: refetchWorkingHours } = trpc.calendar.getWorkingHours.useQuery({});
  const { data: slots, refetch: refetchSlots } = trpc.calendar.getDoctorSlots.useQuery({
    startDate,
    endDate,
  });
  const { data: pendingRequests, refetch: refetchRequests } = trpc.calendar.getPendingRequests.useQuery();

  // Mutations
  const setWorkingHoursMutation = trpc.calendar.setWorkingHours.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم حفظ ساعات العمل بنجاح" : "Working hours saved successfully");
      refetchWorkingHours();
      setShowWorkingHoursDialog(false);
    },
    onError: (error) => {
      toast.error(language === 'ar' ? `خطأ: ${error.message}` : `Error: ${error.message}`);
    },
  });

  const generateSlotsMutation = trpc.calendar.generateSlots.useMutation({
    onSuccess: (data) => {
      toast.success(language === 'ar' ? `تم إنشاء ${data.slotsGenerated} موعد بنجاح` : `${data.slotsGenerated} slots generated successfully`);
      refetchSlots();
    },
    onError: (error) => {
      toast.error(language === 'ar' ? `خطأ: ${error.message}` : `Error: ${error.message}`);
    },
  });

  const confirmRequestMutation = trpc.calendar.confirmBookingRequest.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم تأكيد الحجز بنجاح" : "Booking confirmed successfully");
      refetchRequests();
      refetchSlots();
    },
    onError: (error) => {
      toast.error(language === 'ar' ? `خطأ: ${error.message}` : `Error: ${error.message}`);
    },
  });

  const rejectRequestMutation = trpc.calendar.rejectBookingRequest.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم رفض الحجز" : "Booking rejected");
      refetchRequests();
      refetchSlots();
    },
    onError: (error) => {
      toast.error(language === 'ar' ? `خطأ: ${error.message}` : `Error: ${error.message}`);
    },
  });

  const blockSlotMutation = trpc.calendar.blockSlot.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? "تم حجب الموعد" : "Slot blocked");
      refetchSlots();
    },
    onError: (error) => {
      toast.error(language === 'ar' ? `خطأ: ${error.message}` : `Error: ${error.message}`);
    },
  });

  const handleSetWorkingHours = () => {
    setWorkingHoursMutation.mutate(workingHoursForm);
  };

  const handleGenerateSlots = (days: number) => {
    generateSlotsMutation.mutate({ days });
  };

  const handleConfirmRequest = (requestId: number) => {
    confirmRequestMutation.mutate({ requestId });
  };

  const handleRejectRequest = (requestId: number, reason?: string) => {
    rejectRequestMutation.mutate({ requestId, reason });
  };

  const handleBlockSlot = (slotId: number) => {
    blockSlotMutation.mutate({ slotId });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string; labelEn: string }> = {
      available: { variant: "default", label: "متاح", labelEn: "Available" },
      booked: { variant: "secondary", label: "محجوز", labelEn: "Booked" },
      blocked: { variant: "destructive", label: "محظور", labelEn: "Blocked" },
      completed: { variant: "outline", label: "مكتمل", labelEn: "Completed" },
      cancelled: { variant: "outline", label: "ملغي", labelEn: "Cancelled" },
      past: { variant: "outline", label: "منتهي", labelEn: "Past" },
    };
    const config = statusConfig[status] || { variant: "default", label: status, labelEn: status };
    return <Badge variant={config.variant}>{language === 'ar' ? config.label : config.labelEn}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{language === 'ar' ? 'إدارة التقويم' : 'Calendar Management'}</h1>
          <p className="text-muted-foreground">{language === 'ar' ? 'إدارة مواعيدك وساعات العمل' : 'Manage your appointments and working hours'}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showWorkingHoursDialog} onOpenChange={setShowWorkingHoursDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="ml-2 h-4 w-4" />
                {language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
              </Button>
            </DialogTrigger>
            <DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <DialogHeader>
                <DialogTitle>{language === 'ar' ? 'إعداد ساعات العمل' : 'Set Working Hours'}</DialogTitle>
                <DialogDescription>
                  {language === 'ar' ? 'حدد ساعات العمل الأسبوعية ومدة كل موعد' : 'Set your weekly working hours and appointment duration'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{language === 'ar' ? 'اليوم' : 'Day'}</Label>
                  <Select
                    value={workingHoursForm.dayOfWeek.toString()}
                    onValueChange={(value) =>
                      setWorkingHoursForm({ ...workingHoursForm, dayOfWeek: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {language === 'ar' ? day.label : day.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'ar' ? 'وقت البداية' : 'Start Time'}</Label>
                    <Input
                      type="time"
                      value={workingHoursForm.startTime.slice(0, 5)}
                      onChange={(e) =>
                        setWorkingHoursForm({
                          ...workingHoursForm,
                          startTime: `${e.target.value}:00`,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'وقت النهاية' : 'End Time'}</Label>
                    <Input
                      type="time"
                      value={workingHoursForm.endTime.slice(0, 5)}
                      onChange={(e) =>
                        setWorkingHoursForm({
                          ...workingHoursForm,
                          endTime: `${e.target.value}:00`,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'مدة الموعد' : 'Appointment Duration'}</Label>
                  <Select
                    value={workingHoursForm.slotDuration.toString()}
                    onValueChange={(value) =>
                      setWorkingHoursForm({
                        ...workingHoursForm,
                        slotDuration: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOT_DURATIONS.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value.toString()}>
                          {language === 'ar' ? duration.label : duration.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'وقت الاستراحة بين المواعيد (دقائق)' : 'Buffer Time Between Appointments (minutes)'}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={workingHoursForm.bufferTime}
                    onChange={(e) =>
                      setWorkingHoursForm({
                        ...workingHoursForm,
                        bufferTime: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <Button
                  onClick={handleSetWorkingHours}
                  disabled={setWorkingHoursMutation.isPending}
                  className="w-full"
                >
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => handleGenerateSlots(30)}>
            <Plus className="ml-2 h-4 w-4" />
            {language === 'ar' ? 'إنشاء مواعيد (30 يوم)' : 'Generate Slots (30 days)'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">{language === 'ar' ? 'التقويم' : 'Calendar'}</TabsTrigger>
          <TabsTrigger value="requests">
            {language === 'ar' ? 'طلبات الحجز' : 'Booking Requests'}
            {pendingRequests && pendingRequests.length > 0 && (
              <Badge variant="destructive" className="mr-2">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">{language === 'ar' ? 'الإعدادات' : 'Settings'}</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {language === 'ar' ? 'المواعيد الأسبوعية' : 'Weekly Appointments'}
              </CardTitle>
              <CardDescription>
                {format(new Date(startDate), "d MMMM", { locale: ar })} -{" "}
                {format(new Date(endDate), "d MMMM yyyy", { locale: ar })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slots && slots.length > 0 ? (
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map((day) => {
                    const daySlots = slots.filter((slot) => {
                      const slotDate = new Date(slot.slotDate);
                      return slotDate.getDay() === day.value;
                    });

                    if (daySlots.length === 0) return null;

                    return (
                      <div key={day.value} className="space-y-2">
                        <h3 className="font-semibold">{language === 'ar' ? day.label : day.labelEn}</h3>
                        <div className="grid grid-cols-4 gap-2">
                          {daySlots.map((slot) => (
                            <Card
                              key={slot.id}
                              className="p-3 hover:border-primary cursor-pointer transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  {slot.startTime.slice(0, 5)}
                                </span>
                                {getStatusBadge(slot.status)}
                              </div>
                              {slot.status === "available" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleBlockSlot(slot.id)}
                                  className="w-full text-xs"
                                >
                                  {language === 'ar' ? 'حجب' : 'Block'}
                                </Button>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد مواعيد متاحة' : 'No appointments available'}</p>
                  <Button onClick={() => handleGenerateSlots(30)} className="mt-4">
                    {language === 'ar' ? 'إنشاء مواعيد' : 'Generate Appointments'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {pendingRequests && pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <h3 className="font-semibold">{language === 'ar' ? 'طلب حجز جديد' : 'New Booking Request'}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>{language === 'ar' ? 'الشكوى الرئيسية:' : 'Chief Complaint:'}</strong> {request.chiefComplaint || (language === 'ar' ? 'غير محدد' : 'Not specified')}
                      </p>
                      {request.symptoms && (
                        <p className="text-sm text-muted-foreground">
                          <strong>{language === 'ar' ? 'الأعراض:' : 'Symptoms:'}</strong> {request.symptoms}
                        </p>
                      )}
                      {request.urgencyLevel && (
                        <Badge variant="outline">{request.urgencyLevel}</Badge>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'تاريخ الطلب:' : 'Request Date:'} {format(new Date(request.createdAt), "d MMMM yyyy، HH:mm", { locale: ar })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConfirmRequest(request.id)}
                        disabled={confirmRequestMutation.isPending}
                      >
                        <CheckCircle className="ml-2 h-4 w-4" />
                        {language === 'ar' ? 'تأكيد' : 'Confirm'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={rejectRequestMutation.isPending}
                      >
                        <XCircle className="ml-2 h-4 w-4" />
                        {language === 'ar' ? 'رفض' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد طلبات حجز معلقة' : 'No pending booking requests'}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'ساعات العمل المحفوظة' : 'Saved Working Hours'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'ساعات العمل الأسبوعية الخاصة بك' : 'Your weekly working hours'}</CardDescription>
            </CardHeader>
            <CardContent>
              {workingHours && workingHours.length > 0 ? (
                <div className="space-y-2">
                  {workingHours.map((wh) => {
                    const day = DAYS_OF_WEEK.find((d) => d.value === wh.dayOfWeek);
                    return (
                      <div
                        key={wh.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{day?.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {wh.startTime.slice(0, 5)} - {wh.endTime.slice(0, 5)}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'مدة الموعد:' : 'Appointment Duration:'} {wh.slotDuration} {language === 'ar' ? 'دقيقة' : 'minutes'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {language === 'ar' ? 'لم يتم تعيين ساعات عمل بعد' : 'No working hours set yet'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DoctorCalendar() {
  return (
    <ClinicianLayout>
      <DoctorCalendarContent />
    </ClinicianLayout>
  );
}
