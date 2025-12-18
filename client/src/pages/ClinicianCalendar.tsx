import { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays, startOfDay, endOfDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, User, MapPin, Phone, FileText, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AppointmentEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: any;
}

export default function ClinicianCalendar() {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<AppointmentEvent | null>(null);
  const [view, setView] = useState<any>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  // Calculate date range for fetching appointments
  const dateRange = useMemo(() => {
    const start = startOfDay(addDays(date, -30));
    const end = endOfDay(addDays(date, 30));
    return { start, end };
  }, [date]);

  // Fetch appointments
  const { data: appointments, isLoading, refetch } = trpc.clinical.getAppointmentsByDateRange.useQuery(
    {
      startDate: dateRange.start,
      endDate: dateRange.end,
      clinicianId: user?.id,
    },
    {
      enabled: !!user && user.role === 'admin',
    }
  );

  const updateStatusMutation = trpc.clinical.updateAppointmentStatus.useMutation({
    onSuccess: () => {
      toast.success("Appointment status updated");
      refetch();
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast.error("Failed to update status");
      console.error(error);
    },
  });

  // Convert appointments to calendar events
  const events: AppointmentEvent[] = useMemo(() => {
    if (!appointments) return [];
    
    return appointments.map((apt: any) => {
      const start = new Date(apt.appointmentDate);
      const end = new Date(start.getTime() + (apt.duration || 30) * 60 * 1000);
      
      return {
        id: apt.id,
        title: `${apt.facilityName || 'Appointment'} - ${apt.appointmentType}`,
        start,
        end,
        resource: apt,
      };
    });
  }, [appointments]);

  // Event style getter for color coding
  const eventStyleGetter = (event: AppointmentEvent) => {
    const status = event.resource.status;
    let backgroundColor = '#3b82f6'; // blue for pending
    
    if (status === 'confirmed') backgroundColor = '#10b981'; // green
    else if (status === 'completed') backgroundColor = '#6b7280'; // gray
    else if (status === 'cancelled') backgroundColor = '#ef4444'; // red
    else if (status === 'no_show') backgroundColor = '#f59e0b'; // amber
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedEvent) return;
    
    await updateStatusMutation.mutateAsync({
      appointmentId: selectedEvent.id,
      status: newStatus as any,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-blue-100 text-blue-800' },
      confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
      no_show: { label: 'No Show', className: 'bg-amber-100 text-amber-800' },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Access denied. Clinicians only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-green-600" />
            Appointment Calendar
          </h1>
          <p className="text-gray-600 mt-2">Manage your appointments and schedule</p>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
            Pending
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
            Confirmed
          </Badge>
          <Badge variant="outline" className="bg-gray-50 text-gray-800 border-gray-200">
            Completed
          </Badge>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Appointments</CardDescription>
            <CardTitle className="text-3xl">{appointments?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {appointments?.filter((a: any) => a.status === 'pending').length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {appointments?.filter((a: any) => a.status === 'confirmed').length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-gray-600">
              {appointments?.filter((a: any) => a.status === 'completed').length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : (
            <div style={{ height: '600px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={setSelectedEvent}
                popup
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                step={30}
                showMultiDayTimes
                defaultDate={new Date()}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-green-600" />
              Appointment Details
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && format(selectedEvent.start, 'PPP')}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                {getStatusBadge(selectedEvent.resource.status)}
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>
                  {format(selectedEvent.start, 'p')} - {format(selectedEvent.end, 'p')}
                </span>
              </div>

              {/* Facility */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">{selectedEvent.resource.facilityName}</p>
                  <p className="text-gray-600 text-xs">{selectedEvent.resource.facilityAddress}</p>
                </div>
              </div>

              {/* Appointment Type */}
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="capitalize">{selectedEvent.resource.appointmentType.replace('_', ' ')}</span>
              </div>

              {/* Chief Complaint */}
              {selectedEvent.resource.chiefComplaint && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs font-semibold text-amber-900 mb-1">Chief Complaint:</p>
                  <p className="text-sm text-amber-800">{selectedEvent.resource.chiefComplaint}</p>
                </div>
              )}

              {/* Notes */}
              {selectedEvent.resource.notes && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Notes:</p>
                  <p className="text-sm text-blue-800">{selectedEvent.resource.notes}</p>
                </div>
              )}

              {/* Status Management */}
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">Update Status:</label>
                <Select 
                  value={selectedEvent.resource.status} 
                  onValueChange={handleStatusChange}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
