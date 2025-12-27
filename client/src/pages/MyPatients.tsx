import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, User, MessageCircle, Calendar, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";
import { DoctorAvailabilityToggle } from "@/components/DoctorAvailabilityToggle";

export default function MyPatients() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "pending" | "terminated" | undefined>("active");

  const { data: patients, isLoading } = trpc.b2b2c.doctor.getMyPatients.useQuery({
    status: statusFilter,
    limit: 50,
    offset: 0,
  });

  const filteredPatients = patients?.filter(p => 
    p.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patient?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Patients</h1>
          <p className="text-muted-foreground">
            Manage your connected patients and their medical records
          </p>
        </div>
      </div>

      {/* Availability Toggle */}
      <DoctorAvailabilityToggle />

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(undefined)}
            >
              All
            </Button>
          </div>
        </div>
      </Card>

      {/* Patients List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-semibold text-lg">No Patients Found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "No patients match your search criteria"
                : "You don't have any connected patients yet"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground">
                Set your status to "Available" to allow patients to connect with you
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.map((item) => {
            const patient = item.patient;
            const relationship = item.relationship;

            if (!patient) return null;

            return (
              <Card key={relationship.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{patient.name || "Unnamed Patient"}</h3>
                        <StatusBadge status={relationship.status} />
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Connected: {new Date(relationship.establishedAt).toLocaleDateString()}
                        </span>
                        {relationship.relationshipType && (
                          <Badge variant="outline" className="text-xs">
                            {relationship.relationshipType}
                          </Badge>
                        )}
                      </div>

                      {relationship.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          Reason: {relationship.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/clinician/patients/${patient.id}`}>
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </Link>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/clinician/messages?patient=${patient.id}`)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/clinician/calendar?patient=${patient.id}`)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredPatients.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-500" },
    pending: { label: "Pending", className: "bg-yellow-500" },
    inactive: { label: "Inactive", className: "bg-gray-500" },
    terminated: { label: "Terminated", className: "bg-red-500" },
  };

  const { label, className } = config[status] || { label: status, className: "bg-gray-500" };

  return (
    <Badge className={`${className} text-white text-xs`}>
      {label}
    </Badge>
  );
}
