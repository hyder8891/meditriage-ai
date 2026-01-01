import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, Clock, TrendingUp, AlertCircle, CheckCircle2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DoctorAvailability() {
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<"online" | "busy" | "offline" | "in_consultation">("offline");

  // Get current availability
  const { data: availability, isLoading, refetch } = trpc.matching.getMyAvailability.useQuery();

  // Update availability mutation
  const updateAvailabilityMutation = trpc.matching.updateAvailability.useMutation({
    onSuccess: () => {
      toast({
        title: "Availability Updated",
        description: "Your status has been updated successfully",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get my specialties
  const { data: specialties } = trpc.matching.getMySpecialties.useQuery();

  // Sync local state with server data
  useEffect(() => {
    if (availability) {
      setIsAvailable(availability.isAvailable);
      setAvailabilityStatus(availability.availabilityStatus);
    }
  }, [availability]);

  const handleToggleAvailability = (checked: boolean) => {
    setIsAvailable(checked);
    const newStatus = checked ? "online" : "offline";
    setAvailabilityStatus(newStatus);
    
    updateAvailabilityMutation.mutate({
      isAvailable: checked,
      availabilityStatus: newStatus,
    });
  };

  const handleStatusChange = (status: "online" | "busy" | "offline" | "in_consultation") => {
    setAvailabilityStatus(status);
    setIsAvailable(status !== "offline");
    
    updateAvailabilityMutation.mutate({
      isAvailable: status !== "offline",
      availabilityStatus: status,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "in_consultation":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Available";
      case "busy":
        return "Busy";
      case "in_consultation":
        return "In Consultation";
      default:
        return "Offline";
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const capacityPercentage = availability 
    ? (availability.currentPatientsToday / availability.maxPatientsPerDay) * 100 
    : 0;

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Availability Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your online status and patient capacity
        </p>
      </div>

      {/* Main Status Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(availabilityStatus)} animate-pulse`} />
            <div>
              <h2 className="text-2xl font-bold">Current Status</h2>
              <p className="text-muted-foreground">{getStatusText(availabilityStatus)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Available for Patients</span>
            <Switch
              checked={isAvailable}
              onCheckedChange={handleToggleAvailability}
              disabled={updateAvailabilityMutation.isPending}
            />
          </div>
        </div>

        {/* Status Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant={availabilityStatus === "online" ? "default" : "outline"}
            onClick={() => handleStatusChange("online")}
            disabled={updateAvailabilityMutation.isPending}
            className="h-auto py-4 flex-col gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Online</span>
          </Button>

          <Button
            variant={availabilityStatus === "busy" ? "default" : "outline"}
            onClick={() => handleStatusChange("busy")}
            disabled={updateAvailabilityMutation.isPending}
            className="h-auto py-4 flex-col gap-2"
          >
            <Activity className="w-5 h-5" />
            <span>Busy</span>
          </Button>

          <Button
            variant={availabilityStatus === "in_consultation" ? "default" : "outline"}
            onClick={() => handleStatusChange("in_consultation")}
            disabled={updateAvailabilityMutation.isPending}
            className="h-auto py-4 flex-col gap-2"
          >
            <Users className="w-5 h-5" />
            <span>In Consultation</span>
          </Button>

          <Button
            variant={availabilityStatus === "offline" ? "default" : "outline"}
            onClick={() => handleStatusChange("offline")}
            disabled={updateAvailabilityMutation.isPending}
            className="h-auto py-4 flex-col gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Offline</span>
          </Button>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Today's Patients */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Today's Patients</div>
                <div className="text-2xl font-bold">
                  {availability?.currentPatientsToday || 0} / {availability?.maxPatientsPerDay || 50}
                </div>
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {Math.round(capacityPercentage)}% capacity used
          </div>
        </Card>

        {/* Current Hour */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">This Hour</div>
              <div className="text-2xl font-bold">
                {availability?.currentPatientsThisHour || 0} / {availability?.maxPatientsPerHour || 4}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Patients seen in the current hour
          </div>
        </Card>

        {/* Queue Length */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Queue</div>
              <div className="text-2xl font-bold">{availability?.currentQueueLength || 0}</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Est. wait time: {availability?.estimatedWaitTimeMinutes || 0} min
          </div>
        </Card>
      </div>

      {/* Specialties Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Specialties</h2>
        {specialties && specialties.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {specialties.map((spec) => (
              <Badge key={spec.id} variant={spec.isPrimary ? "default" : "outline"} className="text-sm py-2 px-3">
                {spec.isPrimary && "⭐ "}
                {spec.proficiencyLevel} • {spec.yearsOfExperience}y experience
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No specialties added yet</p>
            <Button variant="outline" className="mt-4">
              Add Specialty
            </Button>
          </div>
        )}
      </Card>

      {/* Info Banner */}
      {isAvailable && (
        <Card className="p-4 mt-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <div className="font-semibold text-green-900 dark:text-green-100">You're visible to patients</div>
              <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                Patients can now find you through the intelligent matching system. You'll receive notifications for new patient requests.
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
