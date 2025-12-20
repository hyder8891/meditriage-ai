import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Circle } from "lucide-react";

type AvailabilityStatus = "available" | "busy" | "offline";

export function DoctorAvailabilityToggle() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Get current status
  const { data: statusData, isLoading } = trpc.b2b2c.doctor.getAvailabilityStatus.useQuery();

  // Set status mutation
  const setStatus = trpc.b2b2c.doctor.setAvailabilityStatus.useMutation({
    onSuccess: (data) => {
      utils.b2b2c.doctor.getAvailabilityStatus.invalidate();
      toast({
        title: "Status Updated",
        description: `You are now ${data.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: AvailabilityStatus) => {
    setStatus.mutate({ status });
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading status...</span>
        </div>
      </Card>
    );
  }

  const currentStatus = statusData?.availabilityStatus || "offline";
  const patientCount = statusData?.currentPatientCount || 0;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Availability Status</h3>
            <p className="text-sm text-muted-foreground">
              Control when patients can connect with you
            </p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>

        {patientCount > 0 && (
          <div className="text-sm text-muted-foreground">
            Currently serving: <span className="font-medium">{patientCount}</span> patient{patientCount !== 1 ? 's' : ''}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={currentStatus === "available" ? "default" : "outline"}
            onClick={() => handleStatusChange("available")}
            disabled={setStatus.isPending}
            className="flex-1"
          >
            <Circle className={`h-3 w-3 mr-2 ${currentStatus === "available" ? "fill-current" : ""}`} />
            Available
          </Button>
          
          <Button
            size="sm"
            variant={currentStatus === "busy" ? "default" : "outline"}
            onClick={() => handleStatusChange("busy")}
            disabled={setStatus.isPending}
            className="flex-1"
          >
            <Circle className={`h-3 w-3 mr-2 ${currentStatus === "busy" ? "fill-current" : ""}`} />
            Busy
          </Button>
          
          <Button
            size="sm"
            variant={currentStatus === "offline" ? "default" : "outline"}
            onClick={() => handleStatusChange("offline")}
            disabled={setStatus.isPending}
            className="flex-1"
          >
            <Circle className={`h-3 w-3 mr-2 ${currentStatus === "offline" ? "fill-current" : ""}`} />
            Offline
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Available:</strong> Patients can connect with you instantly</p>
          <p>• <strong>Busy:</strong> Visible but cannot receive new connections</p>
          <p>• <strong>Offline:</strong> Not accepting any new patients</p>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: AvailabilityStatus }) {
  const config = {
    available: { label: "Available", className: "bg-green-500" },
    busy: { label: "Busy", className: "bg-yellow-500" },
    offline: { label: "Offline", className: "bg-gray-500" },
  };

  const { label, className } = config[status];

  return (
    <Badge className={className}>
      <Circle className="h-2 w-2 mr-1 fill-current" />
      {label}
    </Badge>
  );
}
