import { useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours, startOfDay, endOfDay } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, User, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import ClinicianLayout from "@/components/ClinicianLayout";

const locales = {
  "en-US": enUS,
  ar: ar,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function ClinicianCalendarContent() {
  const { language } = useLanguage();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false);
  const [newAppointmentDate, setNewAppointmentDate] = useState<Date | null>(null);

  // Form state for new appointment
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [notes, setNotes] = useState("");

  const { data: appointments, refetch } = trpc.clinical.getAllAppointments.useQuery();
  const updateStatusMutation = trpc.clinical.updateAppointmentStatus.useMutation({
    onSuccess: () => {
      toast.success("Appointment status updated");
      refetch();
      setShowEventDialog(false);
    },
  });

  const createAppointmentMutation = trpc.clinical.createAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment created successfully");
      refetch();
      setShowNewAppointmentDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create appointment");
    },
  });

  const resetForm = () => {
    setPatientName("");
    setPatientPhone("");
    setPatientEmail("");
    setAppointmentType("consultation");
    setNotes("");
    setNewAppointmentDate(null);
  };

  const events = useMemo(() => {
    if (!appointments) return [];
    return appointments.map((apt: any) => ({
      id: apt.id,
      title: `Patient #${apt.patientId}`,
      start: new Date(apt.appointmentDate),
      end: new Date(new Date(apt.appointmentDate).getTime() + (apt.duration || 30) * 60000),
      resource: apt,
    }));
  }, [appointments]);

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setNewAppointmentDate(start);
    setShowNewAppointmentDialog(true);
  }, []);

  const handleSelectEvent = useCallback((event: any) => {
    setSelectedEvent(event.resource);
    setShowEventDialog(true);
  }, []);

  const handleCreateAppointment = () => {
    if (!newAppointmentDate || !patientName || !patientPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    const startTime = newAppointmentDate;
    const endTime = addHours(startTime, 1);

    createAppointmentMutation.mutate({
      patientId: 1, // TODO: Get from patient selection
      appointmentDate: startTime,
      duration: 60,
      appointmentType: appointmentType as "consultation" | "follow_up" | "emergency" | "screening" | "vaccination" | "other",
      notes: notes || undefined,
    });
  };

  const handleUpdateStatus = (status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show") => {
    if (!selectedEvent) return;
    updateStatusMutation.mutate({
      id: selectedEvent.id,
      status,
    });
  };

  const eventStyleGetter = (event: any) => {
    const status = event.resource.status;
    let backgroundColor = "#3b82f6";
    
    if (status === "confirmed") backgroundColor = "#10b981";
    else if (status === "cancelled") backgroundColor = "#ef4444";
    else if (status === "completed") backgroundColor = "#6b7280";
    else if (status === "pending") backgroundColor = "#f59e0b";

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  const stats = useMemo(() => {
    if (!appointments) return { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    return {
      total: appointments.length,
      pending: appointments.filter((a: any) => a.status === "pending").length,
      confirmed: appointments.filter((a: any) => a.status === "confirmed").length,
      completed: appointments.filter((a: any) => a.status === "completed").length,
      cancelled: appointments.filter((a: any) => a.status === "cancelled").length,
    };
  }, [appointments]);

  const t = {
    title: language === "ar" ? "تقويم المواعيد" : "Appointment Calendar",
    description: language === "ar" ? "إدارة مواعيد المرضى" : "Manage patient appointments",
    totalAppointments: language === "ar" ? "إجمالي المواعيد" : "Total Appointments",
    pending: language === "ar" ? "قيد الانتظار" : "Pending",
    confirmed: language === "ar" ? "مؤكد" : "Confirmed",
    completed: language === "ar" ? "مكتمل" : "Completed",
    cancelled: language === "ar" ? "ملغى" : "Cancelled",
    appointmentDetails: language === "ar" ? "تفاصيل الموعد" : "Appointment Details",
    patientName: language === "ar" ? "اسم المريض" : "Patient Name",
    phone: language === "ar" ? "الهاتف" : "Phone",
    email: language === "ar" ? "البريد الإلكتروني" : "Email",
    type: language === "ar" ? "النوع" : "Type",
    status: language === "ar" ? "الحالة" : "Status",
    time: language === "ar" ? "الوقت" : "Time",
    notes: language === "ar" ? "ملاحظات" : "Notes",
    updateStatus: language === "ar" ? "تحديث الحالة" : "Update Status",
    close: language === "ar" ? "إغلاق" : "Close",
    newAppointment: language === "ar" ? "موعد جديد" : "New Appointment",
    createAppointment: language === "ar" ? "إنشاء موعد" : "Create Appointment",
    cancel: language === "ar" ? "إلغاء" : "Cancel",
    consultation: language === "ar" ? "استشارة" : "Consultation",
    followUp: language === "ar" ? "متابعة" : "Follow-up",
    checkup: language === "ar" ? "فحص" : "Check-up",
    emergency: language === "ar" ? "طوارئ" : "Emergency",
    required: language === "ar" ? "مطلوب" : "Required",
    optional: language === "ar" ? "اختياري" : "Optional",
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.description}</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.totalAppointments}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">{t.pending}</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">{t.confirmed}</p>
                  <p className="text-2xl font-bold text-green-700">{stats.confirmed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">{t.completed}</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">{t.cancelled}</p>
                  <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardContent className="pt-6">
            <div style={{ height: "600px" }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                selectable
                eventPropGetter={eventStyleGetter}
                culture={language === "ar" ? "ar" : "en-US"}
              />
            </div>
          </CardContent>
        </Card>

        {/* Event Details Dialog */}
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.appointmentDetails}</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">{t.patientName}</p>
                    <p className="font-semibold">{selectedEvent.patientName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">{t.phone}</p>
                    <p className="font-semibold">{selectedEvent.patientPhone}</p>
                  </div>
                </div>

                {selectedEvent.patientEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">{t.email}</p>
                      <p className="font-semibold">{selectedEvent.patientEmail}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">{t.time}</p>
                    <p className="font-semibold">
                      {format(new Date(selectedEvent.startTime), "PPp", { locale: language === "ar" ? ar : enUS })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.type}</p>
                  <Badge>{selectedEvent.type}</Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.status}</p>
                  <Badge
                    className={
                      selectedEvent.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : selectedEvent.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : selectedEvent.status === "completed"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-orange-100 text-orange-700"
                    }
                  >
                    {t[selectedEvent.status as keyof typeof t] || selectedEvent.status}
                  </Badge>
                </div>

                {selectedEvent.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t.notes}</p>
                    <p className="text-sm">{selectedEvent.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleUpdateStatus("confirmed")}
                    variant="outline"
                    className="flex-1"
                    disabled={selectedEvent.status === "confirmed"}
                  >
                    {t.confirmed}
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus("completed")}
                    variant="outline"
                    className="flex-1"
                    disabled={selectedEvent.status === "completed"}
                  >
                    {t.completed}
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus("cancelled")}
                    variant="outline"
                    className="flex-1 text-red-600"
                    disabled={selectedEvent.status === "cancelled"}
                  >
                    {t.cancelled}
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                {t.close}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Appointment Dialog */}
        <Dialog open={showNewAppointmentDialog} onOpenChange={setShowNewAppointmentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t.newAppointment}</DialogTitle>
              <DialogDescription>
                {newAppointmentDate && format(newAppointmentDate, "PPp", { locale: language === "ar" ? ar : enUS })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="patientName">
                  {t.patientName} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder={t.patientName}
                />
              </div>

              <div>
                <Label htmlFor="patientPhone">
                  {t.phone} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="patientPhone"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+964..."
                />
              </div>

              <div>
                <Label htmlFor="patientEmail">
                  {t.email} <span className="text-gray-400">({t.optional})</span>
                </Label>
                <Input
                  id="patientEmail"
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="appointmentType">{t.type}</Label>
                <Select value={appointmentType} onValueChange={setAppointmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">{t.consultation}</SelectItem>
                    <SelectItem value="follow-up">{t.followUp}</SelectItem>
                    <SelectItem value="checkup">{t.checkup}</SelectItem>
                    <SelectItem value="emergency">{t.emergency}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">
                  {t.notes} <span className="text-gray-400">({t.optional})</span>
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.notes}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewAppointmentDialog(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleCreateAppointment} disabled={createAppointmentMutation.isPending}>
                {t.createAppointment}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function ClinicianCalendar() {
  return (
    <ClinicianLayout>
      <ClinicianCalendarContent />
    </ClinicianLayout>
  );
}
