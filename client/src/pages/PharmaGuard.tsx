import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Search,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function PharmaGuardContent() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<any>(null);

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

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "severe": return "bg-red-600";
      case "moderate": return "bg-orange-600";
      case "mild": return "bg-yellow-600";
      default: return "bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
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
                PharmaGuard
              </h1>
              <p className="text-gray-600 mt-1">Drug interaction checker & medication safety</p>
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
                          {/* Mechanism */}
                          {interaction.mechanism && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-1">Interaction Mechanism:</p>
                              <p className="text-sm text-gray-600">{interaction.mechanism}</p>
                            </div>
                          )}
                          
                          {/* Clinical Significance */}
                          {interaction.clinicalSignificance && (
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <p className="text-sm font-semibold text-orange-900 mb-1">Clinical Significance:</p>
                              <p className="text-sm text-orange-800">{interaction.clinicalSignificance}</p>
                            </div>
                          )}
                          
                          {/* Management */}
                          {interaction.management && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm font-semibold text-blue-900 mb-1">Management:</p>
                              <p className="text-sm text-blue-800">{interaction.management}</p>
                            </div>
                          )}
                          
                          {/* Alternatives */}
                          {interaction.alternatives && interaction.alternatives.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-2">Alternative Medications:</p>
                              <div className="flex flex-wrap gap-2">
                                {interaction.alternatives.map((alt: string, i: number) => (
                                  <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                    {alt}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Timing */}
                          {interaction.timing && (
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <p className="text-sm font-semibold text-purple-900 mb-1">Timing Recommendations:</p>
                              <p className="text-sm text-purple-800">{interaction.timing}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Overall Risk */}
                {interactions.overallRisk && (
                  <Card className={`card-modern ${
                    interactions.overallRisk === 'high' ? 'border-red-200 bg-red-50' :
                    interactions.overallRisk === 'moderate' ? 'border-orange-200 bg-orange-50' :
                    'border-green-200 bg-green-50'
                  }`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className={`w-5 h-5 ${
                          interactions.overallRisk === 'high' ? 'text-red-600' :
                          interactions.overallRisk === 'moderate' ? 'text-orange-600' :
                          'text-green-600'
                        }`} />
                        Overall Risk: {interactions.overallRisk.toUpperCase()}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                )}

                {/* Recommendations */}
                {interactions.recommendations && interactions.recommendations.length > 0 && (
                  <Card className="card-modern border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-blue-700">
                        <CheckCircle2 className="w-5 h-5" />
                        Clinical Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {interactions.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-blue-900">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Monitoring */}
                {interactions.monitoring && interactions.monitoring.length > 0 && (
                  <Card className="card-modern border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-700">
                        <AlertCircle className="w-5 h-5" />
                        Monitoring Required
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {interactions.monitoring.map((mon: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-purple-900">{mon}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Food Interactions */}
                {interactions.foodInteractions && interactions.foodInteractions.length > 0 && (
                  <Card className="card-modern border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-700">
                        <Pill className="w-5 h-5" />
                        Food & Beverage Interactions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {interactions.foodInteractions.map((food: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-amber-900">{food}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
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
      </div>
    </div>
  );
}

export default function PharmaGuard() {
  return (
    <ClinicianLayout>
      <PharmaGuardContent />
    </ClinicianLayout>
  );
}
