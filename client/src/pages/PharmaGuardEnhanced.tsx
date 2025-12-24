import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pill, 
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Plus,
  Trash2,
  History,
  User
} from "lucide-react";
import { useLocation } from "wouter";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function PharmaGuardEnhancedContent() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<any>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isAddMedDialogOpen, setIsAddMedDialogOpen] = useState(false);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New medication form state
  const [newMed, setNewMed] = useState({
    drugName: "",
    genericName: "",
    brandName: "",
    dosage: "",
    frequency: "",
    route: "oral",
    purpose: "",
    source: "self_reported" as "prescription" | "otc" | "self_reported",
  });

  // Queries
  const patientMedsQuery = trpc.pharmaguard.getMyMedications.useQuery(
    { patientId: selectedPatientId || undefined, activeOnly: true },
    { enabled: true }
  );

  const patientConditionsQuery = trpc.pharmaguard.getMyConditions.useQuery(
    { patientId: selectedPatientId || undefined, activeOnly: true },
    { enabled: true }
  );

  const interactionHistoryQuery = trpc.pharmaguard.getInteractionHistory.useQuery(
    { patientId: selectedPatientId || undefined, limit: 5 },
    { enabled: true }
  );

  // Mutations
  const checkInteractionsMutation = trpc.clinical.checkDrugInteractions.useMutation({
    onSuccess: (data: any) => {
      setInteractions(data);
      if (data.interactions && data.interactions.length > 0) {
        toast.warning(`Found ${data.interactions.length} potential interaction(s)`);
      } else {
        toast.success("No significant interactions detected");
      }
    },
    onError: (error: any) => {
      toast.error("Check failed: " + error.message);
    },
  });

  const checkPersonalizedMutation = trpc.pharmaguard.checkPersonalizedInteractions.useMutation({
    onSuccess: (data: any) => {
      setInteractions(data);
      if (!data.safe) {
        toast.error("⚠️ Safety concerns detected!");
      } else if (data.interactions && data.interactions.length > 0) {
        toast.warning(`Found ${data.interactions.length} interaction(s)`);
      } else {
        toast.success("✅ Safe to use with current medications");
      }
    },
    onError: (error: any) => {
      toast.error("Check failed: " + error.message);
    },
  });

  const addMedicationMutation = trpc.pharmaguard.addMedication.useMutation({
    onSuccess: () => {
      toast.success("Medication added successfully");
      patientMedsQuery.refetch();
      setIsAddMedDialogOpen(false);
      setNewMed({
        drugName: "",
        genericName: "",
        brandName: "",
        dosage: "",
        frequency: "",
        route: "oral",
        purpose: "",
        source: "self_reported",
      });
    },
    onError: (error: any) => {
      toast.error("Failed to add medication: " + error.message);
    },
  });

  const removeMedicationMutation = trpc.pharmaguard.removeMedication.useMutation({
    onSuccess: () => {
      toast.success("Medication removed");
      patientMedsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to remove medication: " + error.message);
    },
  });

  const uploadImageMutation = trpc.pharmaguard.uploadMedicineImage.useMutation({
    onSuccess: async (data) => {
      toast.success("Image uploaded, identifying medicine...");
      // Trigger identification
      identifyMedicineMutation.mutate({ imageId: data.imageId });
    },
    onError: (error: any) => {
      toast.error("Upload failed: " + error.message);
    },
  });

  const identifyMedicineMutation = trpc.pharmaguard.identifyMedicine.useMutation({
    onSuccess: (data) => {
      if (data.identified) {
        toast.success(`Identified: ${data.drugName} ${data.dosage}`);
        // Pre-fill the add medication form
        setNewMed({
          ...newMed,
          drugName: data.drugName || "",
          genericName: data.drugName || "",
          brandName: data.brandName || "",
          dosage: data.dosage || "",
        });
        setIsImageUploadOpen(false);
        setIsAddMedDialogOpen(true);
      } else {
        toast.warning("Could not identify medicine from image");
      }
    },
    onError: (error: any) => {
      toast.error("Identification failed: " + error.message);
    },
  });

  const addMedication = () => {
    if (!searchQuery.trim()) return;
    if (selectedMeds.includes(searchQuery.trim())) {
      toast.error("Medication already added");
      return;
    }
    setSelectedMeds([...selectedMeds, searchQuery.trim()]);
    setSearchQuery("");
  };

  const removeMedication = (med: string) => {
    setSelectedMeds(selectedMeds.filter(m => m !== med));
    setInteractions(null);
  };

  const handleCheck = () => {
    if (selectedMeds.length < 2) {
      toast.error("Add at least 2 medications to check interactions");
      return;
    }

    checkInteractionsMutation.mutate({ medications: selectedMeds });
  };

  const handlePersonalizedCheck = (newMedication: string) => {
    if (!newMedication.trim()) {
      toast.error("Enter a medication name");
      return;
    }

    checkPersonalizedMutation.mutate({ 
      patientId: selectedPatientId || undefined,
      newMedication 
    });
  };

  const handleAddMedication = () => {
    if (!newMed.drugName.trim()) {
      toast.error("Drug name is required");
      return;
    }

    addMedicationMutation.mutate({
      patientId: selectedPatientId || undefined,
      ...newMed,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      toast.error("Image must be less than 16MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const base64Data = base64.split(",")[1];
      setUploadedImage(base64);
      
      uploadImageMutation.mutate({
        imageBase64: base64Data,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "severe":
      case "contraindicated":
      case "major":
        return "bg-red-600";
      case "moderate":
        return "bg-orange-600";
      case "mild":
      case "minor":
        return "bg-yellow-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/clinician/dashboard")}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Pill className="w-8 h-8 text-blue-600" />
                PharmaGuard Pro
              </h1>
              <p className="text-gray-600 mt-1">Drug interaction checker with patient history integration</p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-orange-900 font-semibold mb-1">
                  Professional Use Only
                </p>
                <p className="text-sm text-orange-800">
                  This tool is for healthcare professionals. Always verify interactions with current drug databases 
                  and consider patient-specific factors before making clinical decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="quick-check" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick-check">Quick Check</TabsTrigger>
            <TabsTrigger value="patient-profile">Patient Profile</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Quick Check Tab */}
          <TabsContent value="quick-check" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-6">
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Add Medications
                    </CardTitle>
                    <CardDescription>
                      Enter medication names to check for interactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addMedication()}
                        placeholder="e.g., Aspirin, Warfarin, Metformin"
                      />
                      <Button onClick={addMedication} className="bg-blue-600 hover:bg-blue-700">
                        Add
                      </Button>
                    </div>

                    {selectedMeds.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">
                          Selected Medications ({selectedMeds.length})
                        </p>
                        <div className="space-y-2">
                          {selectedMeds.map((med, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                            >
                              <div className="flex items-center gap-2">
                                <Pill className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-gray-900">{med}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMedication(med)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleCheck}
                      disabled={selectedMeds.length < 2 || checkInteractionsMutation.isPending}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      size="lg"
                    >
                      {checkInteractionsMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Checking interactions...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          Check for Interactions
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Results Section */}
              <div className="space-y-6">
                {interactions ? (
                  <>
                    {/* Summary Card */}
                    <Card className={`card-modern ${interactions.interactions && interactions.interactions.length > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {interactions.interactions && interactions.interactions.length > 0 ? (
                            <>
                              <AlertCircle className="w-5 h-5 text-red-600" />
                              <span className="text-red-700">
                                {interactions.interactions.length} Interaction(s) Found
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <span className="text-green-700">No Significant Interactions</span>
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                    </Card>

                    {/* Interactions List */}
                    {interactions.interactions && interactions.interactions.length > 0 && (
                      <div className="space-y-4">
                        {interactions.interactions.map((interaction: any, index: number) => (
                          <Card key={index} className="card-modern border-red-200">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-lg">
                                  {interaction.drugs?.join(' + ') || `${interaction.drug1} + ${interaction.drug2}`}
                                </CardTitle>
                                <Badge className={`${getSeverityColor(interaction.severity)} text-white`}>
                                  {interaction.severity?.toUpperCase()}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {interaction.mechanism && (
                                <div>
                                  <p className="text-sm font-semibold text-gray-700 mb-1">Interaction Mechanism:</p>
                                  <p className="text-sm text-gray-600">{interaction.mechanism}</p>
                                </div>
                              )}
                              
                              {interaction.clinicalSignificance && (
                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                  <p className="text-sm font-semibold text-orange-900 mb-1">Clinical Significance:</p>
                                  <p className="text-sm text-orange-800">{interaction.clinicalSignificance}</p>
                                </div>
                              )}
                              
                              {interaction.management && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-sm font-semibold text-blue-900 mb-1">Management:</p>
                                  <p className="text-sm text-blue-800">{interaction.management}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Card className="card-modern">
                    <CardContent className="py-12 text-center">
                      <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No interactions checked yet</p>
                      <p className="text-sm text-gray-400">
                        Add at least 2 medications and click "Check for Interactions"
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Patient Profile Tab */}
          <TabsContent value="patient-profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Medications */}
              <Card className="card-modern">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="w-5 h-5" />
                        Current Medications
                      </CardTitle>
                      <CardDescription>
                        {patientMedsQuery.data?.length || 0} active medication(s)
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isImageUploadOpen} onOpenChange={setIsImageUploadOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Camera className="w-4 h-4 mr-2" />
                            Scan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Scan Medicine Package</DialogTitle>
                            <DialogDescription>
                              Upload a photo of the medicine box or strip to identify it automatically
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div 
                              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {uploadedImage ? (
                                <img src={uploadedImage} alt="Uploaded medicine" className="max-h-64 mx-auto rounded" />
                              ) : (
                                <>
                                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 16MB</p>
                                </>
                              )}
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                          </div>
                          {uploadImageMutation.isPending && (
                            <div className="flex items-center justify-center gap-2 text-blue-600">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">Uploading and identifying...</span>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Dialog open={isAddMedDialogOpen} onOpenChange={setIsAddMedDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Medication</DialogTitle>
                            <DialogDescription>
                              Add a new medication to the patient's profile
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="drugName">Drug Name *</Label>
                              <Input
                                id="drugName"
                                value={newMed.drugName}
                                onChange={(e) => setNewMed({ ...newMed, drugName: e.target.value })}
                                placeholder="e.g., Metformin"
                              />
                            </div>
                            <div>
                              <Label htmlFor="dosage">Dosage</Label>
                              <Input
                                id="dosage"
                                value={newMed.dosage}
                                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                                placeholder="e.g., 500mg"
                              />
                            </div>
                            <div>
                              <Label htmlFor="frequency">Frequency</Label>
                              <Input
                                id="frequency"
                                value={newMed.frequency}
                                onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                                placeholder="e.g., twice daily"
                              />
                            </div>
                            <div>
                              <Label htmlFor="purpose">Purpose</Label>
                              <Textarea
                                id="purpose"
                                value={newMed.purpose}
                                onChange={(e) => setNewMed({ ...newMed, purpose: e.target.value })}
                                placeholder="Why is the patient taking this?"
                                rows={2}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={handleAddMedication}
                              disabled={addMedicationMutation.isPending}
                            >
                              {addMedicationMutation.isPending ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                "Add Medication"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {patientMedsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : patientMedsQuery.data && patientMedsQuery.data.length > 0 ? (
                    <div className="space-y-2">
                      {patientMedsQuery.data.map((med: any) => (
                        <div
                          key={med.id}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Pill className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-900">{med.drugName}</span>
                              {med.dosage && (
                                <Badge variant="outline" className="text-xs">{med.dosage}</Badge>
                              )}
                            </div>
                            {med.frequency && (
                              <p className="text-sm text-gray-600 mt-1">{med.frequency}</p>
                            )}
                            {med.purpose && (
                              <p className="text-xs text-gray-500 mt-1">{med.purpose}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMedicationMutation.mutate({ medicationId: med.id })}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Pill className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No medications recorded</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medical Conditions & Personalized Check */}
              <div className="space-y-6">
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Medical Conditions
                    </CardTitle>
                    <CardDescription>
                      {patientConditionsQuery.data?.length || 0} active condition(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {patientConditionsQuery.isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : patientConditionsQuery.data && patientConditionsQuery.data.length > 0 ? (
                      <div className="space-y-2">
                        {patientConditionsQuery.data.map((condition: any) => (
                          <div
                            key={condition.id}
                            className="p-2 bg-amber-50 rounded border border-amber-200"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-amber-900">{condition.conditionName}</span>
                              <Badge variant="outline" className="text-xs">
                                {condition.severity}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No conditions recorded</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="card-modern border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                      <AlertTriangle className="w-5 h-5" />
                      Personalized Safety Check
                    </CardTitle>
                    <CardDescription>
                      Check a new medication against patient's profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handlePersonalizedCheck(searchQuery)}
                        placeholder="Enter new medication name"
                      />
                      <Button 
                        onClick={() => handlePersonalizedCheck(searchQuery)}
                        disabled={checkPersonalizedMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {checkPersonalizedMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Check"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      This will check the new medication against the patient's current medications and medical conditions
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Interaction Check History
                </CardTitle>
                <CardDescription>
                  Recent drug interaction checks for this patient
                </CardDescription>
              </CardHeader>
              <CardContent>
                {interactionHistoryQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : interactionHistoryQuery.data && interactionHistoryQuery.data.length > 0 ? (
                  <div className="space-y-4">
                    {interactionHistoryQuery.data.map((check: any) => (
                      <div
                        key={check.id}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {JSON.parse(check.medicationsChecked).length} medications checked
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(check.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Badge className={getSeverityColor(check.highestSeverity)}>
                            {check.overallRisk.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {JSON.parse(check.medicationsChecked).map((med: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {med}
                            </Badge>
                          ))}
                        </div>
                        {check.interactionsFound > 0 && (
                          <p className="text-sm text-red-600 mt-2">
                            ⚠️ {check.interactionsFound} interaction(s) found
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No interaction checks yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function PharmaGuardEnhanced() {
  return (
    <ClinicianLayout>
      <PharmaGuardEnhancedContent />
    </ClinicianLayout>
  );
}
