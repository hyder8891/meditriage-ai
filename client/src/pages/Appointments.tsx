import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const appointmentTypeLabels = {
  consultation: "Consultation",
  follow_up: "Follow-up",
  emergency: "Emergency",
  screening: "Screening",
  vaccination: "Vaccination",
  other: "Other",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  no_show: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function Appointments() {
  const { toast } = useToast();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(true);

  // Form state
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("consultation");
  const [facilityName, setFacilityName] = useState("");
  const [facilityAddress, setFacilityAddress] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [notes, setNotes] = useState("");

  const { data: appointments, isLoading, refetch } = trpc.appointments.getMyAppointments.useQuery({
    upcoming: showUpcoming,
  });
  const { data: stats } = trpc.appointments.getAppointmentStats.useQuery();
  const createMutation = trpc.appointments.createAppointment.useMutation();
  const updateStatusMutation = trpc.appointments.updateAppointmentStatus.useMutation();

  const handleBookAppointment = async () => {
    if (!appointmentDate || !appointmentTime) {
      toast({
        title: "Missing information",
        description: "Please select date and time",
        variant: "destructive",
      });
      return;
    }

    try {
      // Combine date and time
      const dateTimeString = `${appointmentDate}T${appointmentTime}:00`;

      await createMutation.mutateAsync({
        appointmentDate: dateTimeString,
        appointmentType: appointmentType as any,
        facilityName: facilityName || undefined,
        facilityAddress: facilityAddress || undefined,
        chiefComplaint: chiefComplaint || undefined,
        notes: notes || undefined,
      });

      toast({
        title: "Appointment booked",
        description: "Your appointment has been scheduled successfully",
      });

      // Reset form
      setAppointmentDate("");
      setAppointmentTime("");
      setAppointmentType("consultation");
      setFacilityName("");
      setFacilityAddress("");
      setChiefComplaint("");
      setNotes("");
      setIsBookingDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Failed to book appointment",
        variant: "destructive",
      });
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        appointmentId,
        status: "cancelled",
        cancellationReason: "Cancelled by patient",
      });

      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Cancellation failed",
        description: error instanceof Error ? error.message : "Failed to cancel appointment",
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return {
      date: format(d, "MMM dd, yyyy"),
      time: format(d, "hh:mm a"),
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Appointments</h1>
        <p className="text-muted-foreground mt-2">
          Book and manage your medical appointments
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.byStatus.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>
                Schedule a new medical appointment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Appointment Type *</Label>
                <Select value={appointmentType} onValueChange={setAppointmentType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(appointmentTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="facility">Facility Name (Optional)</Label>
                <Input
                  id="facility"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="e.g., City General Hospital"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Facility Address (Optional)</Label>
                <Input
                  id="address"
                  value={facilityAddress}
                  onChange={(e) => setFacilityAddress(e.target.value)}
                  placeholder="e.g., 123 Main St, Baghdad"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complaint">Chief Complaint (Optional)</Label>
                <Textarea
                  id="complaint"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Describe your main concern..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsBookingDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleBookAppointment} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Book Appointment
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant={showUpcoming ? "default" : "outline"}
          onClick={() => setShowUpcoming(true)}
        >
          Upcoming
        </Button>
        <Button
          variant={!showUpcoming ? "default" : "outline"}
          onClick={() => setShowUpcoming(false)}
        >
          All Appointments
        </Button>
      </div>

      {/* Appointments List */}
      {appointments && appointments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((apt) => {
            const { date, time } = formatDateTime(apt.appointmentDate);
            return (
              <Card key={apt.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={statusColors[apt.status]}>
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </Badge>
                        <Badge variant="outline">
                          {appointmentTypeLabels[apt.appointmentType as keyof typeof appointmentTypeLabels]}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-lg font-semibold">
                          <CalendarIcon className="h-5 w-5 text-primary" />
                          {date} at {time}
                        </div>
                        {apt.facilityName && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {apt.facilityName}
                          </div>
                        )}
                        {apt.facilityAddress && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                            {apt.facilityAddress}
                          </div>
                        )}
                        {apt.chiefComplaint && (
                          <div className="flex items-start gap-2 text-sm mt-2">
                            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <span>{apt.chiefComplaint}</span>
                          </div>
                        )}
                        {apt.notes && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4 mt-0.5" />
                            <span>{apt.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {apt.status === "pending" || apt.status === "confirmed" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelAppointment(apt.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {showUpcoming ? "No upcoming appointments" : "No appointments yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {showUpcoming
                ? "You don't have any upcoming appointments"
                : "Book your first appointment to get started"}
            </p>
            <Button onClick={() => setIsBookingDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
