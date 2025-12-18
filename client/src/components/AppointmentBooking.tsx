import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Loader2, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface AppointmentBookingProps {
  facility: {
    id?: number;
    name: string;
    address: string;
  };
  open: boolean;
  onClose: () => void;
}

export function AppointmentBooking({ facility, open, onClose }: AppointmentBookingProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [appointmentType, setAppointmentType] = useState<string>("consultation");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const createAppointmentMutation = trpc.clinical.createAppointment.useMutation();

  // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute of [0, 30]) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to book an appointment");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error("Please select date and time");
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`);

      await createAppointmentMutation.mutateAsync({
        patientId: user.id,
        facilityId: facility.id,
        facilityName: facility.name,
        facilityAddress: facility.address,
        appointmentDate: appointmentDateTime,
        duration: 30,
        appointmentType: appointmentType as any,
        chiefComplaint: chiefComplaint || undefined,
        notes: notes || undefined,
      });

      setIsSuccess(true);
      toast.success("Appointment booked successfully!");
      
      // Reset form after 2 seconds and close
      setTimeout(() => {
        setSelectedDate("");
        setSelectedTime("");
        setAppointmentType("consultation");
        setChiefComplaint("");
        setNotes("");
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Appointment booking error:", error);
      if (error.message.includes("conflict")) {
        toast.error("This time slot is no longer available. Please choose another time.");
      } else {
        toast.error("Failed to book appointment. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Book Appointment
          </DialogTitle>
          <DialogDescription>
            Schedule an appointment at {facility.name}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Appointment Confirmed!</h3>
            <p className="text-sm text-gray-600 text-center">
              You will receive a confirmation email shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Facility Info */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">{facility.name}</p>
              <p className="text-xs text-blue-700 mt-1">{facility.address}</p>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date">Appointment Date *</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                required
                className="w-full"
              />
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label htmlFor="time">Appointment Time *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {slot}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Appointment Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Appointment Type *</Label>
              <Select value={appointmentType} onValueChange={setAppointmentType} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">General Consultation</SelectItem>
                  <SelectItem value="follow_up">Follow-up Visit</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="screening">Health Screening</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chief Complaint */}
            <div className="space-y-2">
              <Label htmlFor="complaint">Chief Complaint</Label>
              <Input
                id="complaint"
                placeholder="e.g., Headache, fever, chest pain"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information for the doctor"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !user}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Appointment
                  </>
                )}
              </Button>
            </div>

            {!user && (
              <p className="text-xs text-amber-600 text-center mt-2">
                Please log in to book an appointment
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
