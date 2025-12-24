import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, User, Circle, Check, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AvailabilityStatus = "available" | "busy" | "offline" | "all";

export default function FindDoctor() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus>("available");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [connectionReason, setConnectionReason] = useState("");
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const { data: doctors, isLoading } = trpc.b2b2c.patient.searchDoctors.useQuery({
    availabilityStatus: statusFilter,
    limit: 50,
    offset: 0,
  });

  const connectMutation = trpc.b2b2c.patient.connectWithDoctor.useMutation({
    onSuccess: (data) => {
      console.log('[FindDoctor] Connection successful:', data);
      toast({
        title: "Connected Successfully!",
        description: "You can now message the doctor",
      });
      setShowConnectDialog(false);
      setConnectionReason("");
      utils.b2b2c.patient.getMyDoctors.invalidate();
      utils.b2b2c.messaging.getConversations.invalidate();
    },
    onError: (error) => {
      console.error('[FindDoctor] Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Unable to connect with doctor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (doctorId: number) => {
    setSelectedDoctor(doctorId);
    setShowConnectDialog(true);
  };

  const confirmConnect = () => {
    console.log('[FindDoctor] Attempting to connect with doctor:', selectedDoctor);
    if (selectedDoctor) {
      connectMutation.mutate({
        doctorId: selectedDoctor,
        reason: connectionReason || undefined,
      });
    } else {
      console.error('[FindDoctor] No doctor selected');
      toast({
        title: "Error",
        description: "No doctor selected. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredDoctors = doctors?.filter(d =>
    d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="container max-w-6xl py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 px-3 sm:px-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Find a Doctor</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Connect with available doctors instantly for consultation
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-1 sm:gap-2 flex-wrap">
            <Button
              variant={statusFilter === "available" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("available")}
            >
              <Circle className="h-3 w-3 mr-1 sm:mr-2 fill-green-500 text-green-500" />
              <span className="hidden sm:inline">Available Now</span>
              <span className="sm:hidden">Available</span>
            </Button>
            <Button
              variant={statusFilter === "busy" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("busy")}
            >
              <Circle className="h-3 w-3 mr-2 fill-yellow-500 text-yellow-500" />
              Busy
            </Button>
            <Button
              variant={statusFilter === "offline" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("offline")}
            >
              <Circle className="h-3 w-3 mr-2 fill-gray-500 text-gray-500" />
              Offline
            </Button>
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All Doctors
            </Button>
          </div>
        </div>
      </Card>

      {/* Doctors List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDoctors.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-semibold text-lg">No Doctors Found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "No doctors match your search criteria"
                : statusFilter === "available"
                ? "No doctors are currently available. Try checking back later."
                : "No doctors found with the selected filters"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filteredDoctors.map((doctor) => {
            const isAvailable = doctor.availabilityStatus === "available";
            const isBusy = doctor.availabilityStatus === "busy";
            const isOffline = doctor.availabilityStatus === "offline";

            return (
              <Card key={doctor.id} className="p-3 sm:p-4 hover:shadow-md active:scale-[0.98] transition-all">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                  <div className="flex gap-3 sm:gap-4 flex-1 w-full">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <h3 className="font-semibold text-base sm:text-lg truncate">{doctor.name || "Dr. Unknown"}</h3>
                        <AvailabilityBadge status={doctor.availabilityStatus || "offline"} />
                        {doctor.verified && (
                          <Badge variant="outline" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      
                      {doctor.specialty && (
                        <p className="text-sm font-medium text-primary">{doctor.specialty}</p>
                      )}
                      
                      {doctor.licenseNumber && (
                        <p className="text-xs text-muted-foreground">
                          License: {doctor.licenseNumber}
                        </p>
                      )}

                      {isBusy && doctor.currentPatientCount && (
                        <p className="text-sm text-yellow-600">
                          Currently with {doctor.currentPatientCount} patient{doctor.currentPatientCount !== 1 ? 's' : ''}
                        </p>
                      )}

                      {isOffline && (
                        <p className="text-sm text-muted-foreground">
                          Not available right now
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {isAvailable ? (
                      <Button
                        onClick={() => handleConnect(doctor.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Connect Now
                      </Button>
                    ) : (
                      <Button disabled variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {isBusy ? "Busy" : "Offline"}
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredDoctors.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Connect Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect with Doctor</DialogTitle>
            <DialogDescription>
              You'll be able to message the doctor immediately after connecting
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for consultation (optional)
              </label>
              <Textarea
                placeholder="E.g., Chest pain, Follow-up appointment, Prescription refill..."
                value={connectionReason}
                onChange={(e) => setConnectionReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This helps the doctor understand your needs better
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConnectDialog(false)}
              disabled={connectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmConnect}
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Connect Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AvailabilityBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    available: { label: "Available", color: "bg-green-500" },
    busy: { label: "Busy", color: "bg-yellow-500" },
    offline: { label: "Offline", color: "bg-gray-500" },
  };

  const { label, color } = config[status] || { label: "Unknown", color: "bg-gray-500" };

  return (
    <Badge className={`${color} text-white text-xs`}>
      <Circle className="h-2 w-2 mr-1 fill-current" />
      {label}
    </Badge>
  );
}
