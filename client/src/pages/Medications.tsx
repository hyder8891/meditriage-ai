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
  Pill,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Loader2,
  Plus,
  Calendar,
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

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-300",
  completed: "bg-blue-100 text-blue-800 border-blue-300",
  discontinued: "bg-red-100 text-red-800 border-red-300",
  on_hold: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

const statusLabels = {
  active: "Active",
  completed: "Completed",
  discontinued: "Discontinued",
  on_hold: "On Hold",
};

export default function Medications() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [medicationName, setMedicationName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [route, setRoute] = useState("oral");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [warnings, setWarnings] = useState("");

  const { data: medications, isLoading, refetch } = trpc.medications.getMyMedications.useQuery();
  const { data: stats } = trpc.medications.getMedicationStats.useQuery();
  const addMutation = trpc.medications.addMedication.useMutation();
  const updateStatusMutation = trpc.medications.updateMedicationStatus.useMutation();
  const markTakenMutation = trpc.medications.markMedicationTaken.useMutation();
  const deleteMutation = trpc.medications.deleteMedication.useMutation();

  const handleAddMedication = async () => {
    if (!medicationName || !dosage || !frequency || !startDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await addMutation.mutateAsync({
        medicationName,
        genericName: genericName || undefined,
        dosage,
        frequency,
        route: route || undefined,
        startDate,
        endDate: endDate || undefined,
        instructions: instructions || undefined,
        warnings: warnings || undefined,
      });

      toast({
        title: "Medication added",
        description: "Your medication has been added successfully",
      });

      // Reset form
      setMedicationName("");
      setGenericName("");
      setDosage("");
      setFrequency("");
      setRoute("oral");
      setStartDate("");
      setEndDate("");
      setInstructions("");
      setWarnings("");
      setIsAddDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Failed to add medication",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleMarkTaken = async (medicationId: number) => {
    try {
      await markTakenMutation.mutateAsync({
        medicationId,
      });

      toast({
        title: "Marked as taken",
        description: "Medication dose recorded",
      });
    } catch (error) {
      toast({
        title: "Failed to mark as taken",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (medicationId: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        medicationId,
        status: status as any,
      });

      toast({
        title: "Status updated",
        description: "Medication status has been updated",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (medicationId: number, medicationName: string) => {
    if (!confirm(`Are you sure you want to delete "${medicationName}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ medicationId });
      toast({
        title: "Medication deleted",
        description: "The medication has been removed",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete medication",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM dd, yyyy");
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
        <h1 className="text-3xl font-bold">My Medications</h1>
        <p className="text-muted-foreground mt-2">
          Manage your medications and track adherence
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Discontinued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.discontinued}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Button */}
      <div className="mb-6">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
              <DialogDescription>
                Add a medication to track and set reminders
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="medicationName">Medication Name *</Label>
                <Input
                  id="medicationName"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  placeholder="e.g., Aspirin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genericName">Generic Name (Optional)</Label>
                <Input
                  id="genericName"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  placeholder="e.g., Acetylsalicylic acid"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage *</Label>
                  <Input
                    id="dosage"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Input
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="e.g., Twice daily"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="route">Route</Label>
                <Select value={route} onValueChange={setRoute}>
                  <SelectTrigger id="route">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oral">Oral</SelectItem>
                    <SelectItem value="injection">Injection</SelectItem>
                    <SelectItem value="topical">Topical</SelectItem>
                    <SelectItem value="inhalation">Inhalation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., Take with food"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warnings">Warnings (Optional)</Label>
                <Textarea
                  id="warnings"
                  value={warnings}
                  onChange={(e) => setWarnings(e.target.value)}
                  placeholder="e.g., Do not take with alcohol"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={addMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleAddMedication} disabled={addMutation.isPending}>
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Medication
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Medications List */}
      {medications && medications.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {medications.map((med) => (
            <Card key={med.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Pill className="h-6 w-6 text-primary" />
                      <h3 className="text-xl font-semibold">{med.medicationName}</h3>
                      <Badge className={statusColors[med.status]}>
                        {statusLabels[med.status]}
                      </Badge>
                    </div>
                    {med.genericName && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Generic: {med.genericName}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Dosage:</span>
                        <span>{med.dosage}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-medium">Frequency:</span>
                        <span>{med.frequency}</span>
                      </div>
                      {med.route && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Route:</span>
                          <span className="capitalize">{med.route}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Started: {formatDate(med.startDate)}</span>
                        {med.endDate && <span>• Ends: {formatDate(med.endDate)}</span>}
                      </div>
                      {med.instructions && (
                        <div className="text-sm mt-2">
                          <span className="font-medium">Instructions:</span> {med.instructions}
                        </div>
                      )}
                      {med.warnings && (
                        <div className="flex items-start gap-2 text-sm text-amber-700 mt-2">
                          <AlertCircle className="h-4 w-4 mt-0.5" />
                          <span>{med.warnings}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {med.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkTaken(med.id)}
                        disabled={markTakenMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(med.id, med.medicationName)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Pill className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No medications yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first medication to start tracking
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
