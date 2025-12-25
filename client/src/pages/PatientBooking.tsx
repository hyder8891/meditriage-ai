import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ar } from "date-fns/locale";
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

interface PatientBookingProps {
  doctorId?: number;
  doctorName?: string;
}

export default function PatientBooking({ doctorId, doctorName }: PatientBookingProps) {
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
      toast.success("تم إرسال طلب الحجز بنجاح");
      setShowBookingDialog(false);
      setSelectedSlot(null);
      setBookingForm({ chiefComplaint: "", symptoms: "" });
      refetchSlots();
      refetchRequests();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const cancelRequestMutation = trpc.calendar.cancelBookingRequest.useMutation({
    onSuccess: () => {
      toast.success("تم إلغاء طلب الحجز");
      refetchRequests();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
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
    if (confirm("هل أنت متأكد من إلغاء طلب الحجز؟")) {
      cancelRequestMutation.mutate({ requestId });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; variant: any; label: string }> = {
      pending: { icon: AlertCircle, variant: "default", label: "قيد الانتظار" },
      confirmed: { icon: CheckCircle2, variant: "default", label: "مؤكد" },
      rejected: { icon: XCircle, variant: "destructive", label: "مرفوض" },
      cancelled: { icon: XCircle, variant: "outline", label: "ملغي" },
    };
    const config = statusConfig[status] || { icon: AlertCircle, variant: "default", label: status };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
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

  if (!doctorId) {
    return (
      <div className="container mx-auto py-12 text-center" dir="rtl">
        <User className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">اختر طبيباً</h2>
        <p className="text-muted-foreground">
          يرجى اختيار طبيب لعرض المواعيد المتاحة
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">حجز موعد</h1>
          {doctorName && (
            <p className="text-muted-foreground">مع {doctorName}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="available" dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">المواعيد المتاحة</TabsTrigger>
          <TabsTrigger value="my-requests">
            طلباتي
            {myRequests && myRequests.length > 0 && (
              <Badge variant="secondary" className="mr-2">
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
                المواعيد المتاحة
              </CardTitle>
              <CardDescription>
                اختر الموعد المناسب لك
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableSlots && availableSlots.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupSlotsByDate(availableSlots)).map(([date, slots]) => (
                    <div key={date} className="space-y-3">
                      <h3 className="font-semibold text-lg">
                        {format(new Date(date), "EEEE، d MMMM yyyy", { locale: ar })}
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
                    لا توجد مواعيد متاحة حالياً
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    يرجى المحاولة لاحقاً أو اختيار تاريخ آخر
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
                          <strong>الشكوى:</strong> {request.chiefComplaint}
                        </p>
                      )}
                      {request.symptoms && (
                        <p className="text-sm text-muted-foreground">
                          <strong>الأعراض:</strong> {request.symptoms}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        تاريخ الطلب: {format(new Date(request.createdAt), "d MMMM yyyy، HH:mm", { locale: ar })}
                      </p>
                      {request.status === "rejected" && request.rejectionReason && (
                        <div className="mt-2 p-3 bg-destructive/10 rounded-lg">
                          <p className="text-sm font-medium text-destructive">سبب الرفض:</p>
                          <p className="text-sm text-muted-foreground">{request.rejectionReason}</p>
                        </div>
                      )}
                      {request.status === "confirmed" && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            ✓ تم تأكيد موعدك بنجاح
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
                        إلغاء
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
                <p className="text-muted-foreground">لا توجد طلبات حجز</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحجز</DialogTitle>
            <DialogDescription>
              {selectedSlot && (
                <>
                  الموعد: {format(new Date(selectedSlot.slotDate), "EEEE، d MMMM yyyy", { locale: ar })}
                  {" - "}
                  {selectedSlot.startTime.slice(0, 5)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الشكوى الرئيسية</Label>
              <Textarea
                placeholder="اذكر سبب الزيارة..."
                value={bookingForm.chiefComplaint}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, chiefComplaint: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label>الأعراض (اختياري)</Label>
              <Textarea
                placeholder="اذكر الأعراض التي تعاني منها..."
                value={bookingForm.symptoms}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, symptoms: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>ملاحظة:</strong> سيتم إرسال طلب الحجز إلى الطبيب للمراجعة. 
                ستتلقى إشعاراً عند تأكيد أو رفض الموعد.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBooking}
                disabled={createBookingMutation.isPending || !bookingForm.chiefComplaint}
                className="flex-1"
              >
                {createBookingMutation.isPending ? "جاري الإرسال..." : "تأكيد الحجز"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBookingDialog(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
