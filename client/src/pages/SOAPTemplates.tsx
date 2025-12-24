import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Streamdown } from "streamdown";
import {
  FileText,
  Download,
  QrCode,
  FileCode,
  Clock,
  Eye,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Heart,
  Thermometer,
  Stethoscope,
  Baby,
  Languages,
} from "lucide-react";
import { ClinicianLayout } from "@/components/ClinicianLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Template category icons
const categoryIcons: Record<string, any> = {
  chest_pain: Heart,
  fever: Thermometer,
  trauma: AlertCircle,
  pediatric: Baby,
  general: Stethoscope,
};

// Template category colors
const categoryColors: Record<string, string> = {
  chest_pain: "text-red-500",
  fever: "text-orange-500",
  trauma: "text-yellow-500",
  pediatric: "text-blue-500",
  general: "text-gray-500",
};

function SOAPTemplatesContent() {
  const { user, loading: authLoading } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf_with_qr" | "pdf_simple" | "hl7_v2">("pdf_with_qr");
  const [exportPurpose, setExportPurpose] = useState("");
  const [destinationSystem, setDestinationSystem] = useState("");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  
  // Mock SOAP note data for export (in real app, this would come from actual patient encounter)
  const [soapNoteData, setSoapNoteData] = useState({
    patientName: "",
    patientAge: 0,
    patientGender: "",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  // Queries
  const { data: templates, isLoading: templatesLoading } = trpc.soap.getTemplates.useQuery();
  const { data: exports, refetch: refetchExports } = trpc.soap.getPatientExports.useQuery(
    { patientId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Mutations
  const seedTemplatesMutation = trpc.soap.seedTemplates.useMutation({
    onSuccess: () => {
      toast.success("Templates seeded successfully!");
    },
    onError: (error) => {
      toast.error("Failed to seed templates: " + error.message);
    },
  });

  const useTemplateMutation = trpc.soap.useTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template applied successfully!");
    },
  });

  const exportToPdfMutation = trpc.soap.exportToPdf.useMutation({
    onSuccess: (data) => {
      toast.success("SOAP note exported successfully!");
      setShowExportModal(false);
      refetchExports();
      
      // Open exported file in new tab
      if (data.fileUrl) {
        window.open(data.fileUrl, "_blank");
      }
    },
    onError: (error) => {
      toast.error("Export failed: " + error.message);
    },
  });

  const exportToHL7Mutation = trpc.soap.exportToHL7.useMutation({
    onSuccess: (data) => {
      toast.success("SOAP note exported to HL7 successfully!");
      setShowExportModal(false);
      refetchExports();
      
      // Download HL7 file
      if (data.fileUrl) {
        const a = document.createElement("a");
        a.href = data.fileUrl;
        a.download = `soap-note-${data.exportId}.hl7`;
        a.click();
      }
    },
    onError: (error) => {
      toast.error("Export failed: " + error.message);
    },
  });

  const [templateIdToFetch, setTemplateIdToFetch] = useState<number | null>(null);
  
  const getTemplateByIdQuery = trpc.soap.getTemplateById.useQuery(
    { id: templateIdToFetch || 0 },
    { enabled: !!templateIdToFetch }
  );

  useEffect(() => {
    if (getTemplateByIdQuery.data && templateIdToFetch) {
      setSelectedTemplate(getTemplateByIdQuery.data);
      setShowTemplateModal(true);
      setTemplateIdToFetch(null);
    }
  }, [getTemplateByIdQuery.data, templateIdToFetch]);

  const handleViewTemplate = (templateId: number) => {
    setTemplateIdToFetch(templateId);
  };

  const handleUseTemplate = (templateId: number) => {
    useTemplateMutation.mutate({ templateId });
    setShowTemplateModal(false);
    // In real app, this would populate the SOAP note form with template structure
    toast.info("Template structure copied. You can now fill in patient-specific details.");
  };

  const handleExport = () => {
    if (!soapNoteData.patientName || !soapNoteData.subjective) {
      toast.error("Please fill in required SOAP note fields");
      return;
    }

    const exportData = {
      soapNote: {
        patientId: user?.id || 0,
        patientName: soapNoteData.patientName,
        patientAge: soapNoteData.patientAge || undefined,
        patientGender: soapNoteData.patientGender || undefined,
        clinicianId: user?.id || 0,
        clinicianName: user?.name || "Unknown Clinician",
        encounterDate: new Date(),
        subjective: soapNoteData.subjective,
        objective: soapNoteData.objective,
        assessment: soapNoteData.assessment,
        plan: soapNoteData.plan,
      },
      options: {
        format: exportFormat,
        destinationSystem: destinationSystem || undefined,
        exportPurpose: exportPurpose || undefined,
        expiresInHours: 720, // 30 days
      },
    };

    if (exportFormat.startsWith("pdf")) {
      exportToPdfMutation.mutate(exportData as any);
    } else {
      exportToHL7Mutation.mutate(exportData as any);
    }
  };

  const handleSeedTemplates = () => {
    if (user?.role === "admin" || user?.role === "super_admin") {
      seedTemplatesMutation.mutate();
    } else {
      toast.error("Only administrators can seed templates");
    }
  };

  // Group templates by category
  const groupedTemplates = templates?.reduce((acc: any, template: any) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {});

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SOAP Note Templates & EMR Export</h1>
          <p className="text-muted-foreground mt-2">
            Pre-built templates for common Iraqi medical scenarios and EMR system integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          >
            <Languages className="h-4 w-4 mr-2" />
            {language === "en" ? "العربية" : "English"}
          </Button>
          {(user?.role === "admin" || user?.role === "super_admin") && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedTemplates}
              disabled={seedTemplatesMutation.isPending}
            >
              {seedTemplatesMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Seed Templates
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="exports">Export History</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !templates || templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No templates available. Click "Seed Templates" to load pre-built templates.
                </p>
                {(user?.role === "admin" || user?.role === "super_admin") && (
                  <Button onClick={handleSeedTemplates} disabled={seedTemplatesMutation.isPending}>
                    {seedTemplatesMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Seed Templates
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTemplates || {}).map(([category, categoryTemplates]: [string, any]) => {
                const Icon = categoryIcons[category] || Stethoscope;
                const colorClass = categoryColors[category] || "text-gray-500";

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon className={`h-5 w-5 ${colorClass}`} />
                      <h2 className="text-xl font-semibold capitalize">
                        {category.replace(/_/g, " ")}
                      </h2>
                      <Badge variant="secondary">{categoryTemplates.length}</Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {categoryTemplates.map((template: any) => (
                        <Card key={template.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span className="text-lg">
                                {language === "ar" ? template.nameAr : template.name}
                              </span>
                              <Icon className={`h-5 w-5 ${colorClass}`} />
                            </CardTitle>
                            <CardDescription>
                              {language === "ar" ? template.descriptionAr : template.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                Used {template.usageCount || 0} times
                              </span>
                              {template.lastUsed && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(template.lastUsed).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleViewTemplate(template.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleUseTemplate(template.id)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Use
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export SOAP Note to EMR
              </CardTitle>
              <CardDescription>
                Export completed SOAP notes to PDF with QR code or HL7 format for EMR systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Patient Name *</Label>
                  <Input
                    placeholder="Enter patient name"
                    value={soapNoteData.patientName}
                    onChange={(e) => setSoapNoteData({ ...soapNoteData, patientName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      placeholder="Age"
                      value={soapNoteData.patientAge || ""}
                      onChange={(e) => setSoapNoteData({ ...soapNoteData, patientAge: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={soapNoteData.patientGender}
                      onValueChange={(value) => setSoapNoteData({ ...soapNoteData, patientGender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subjective *</Label>
                <Textarea
                  placeholder="Patient's chief complaint and history..."
                  rows={3}
                  value={soapNoteData.subjective}
                  onChange={(e) => setSoapNoteData({ ...soapNoteData, subjective: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Objective</Label>
                <Textarea
                  placeholder="Physical examination findings, vital signs..."
                  rows={3}
                  value={soapNoteData.objective}
                  onChange={(e) => setSoapNoteData({ ...soapNoteData, objective: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Assessment</Label>
                <Textarea
                  placeholder="Diagnosis and clinical impression..."
                  rows={2}
                  value={soapNoteData.assessment}
                  onChange={(e) => setSoapNoteData({ ...soapNoteData, assessment: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Plan</Label>
                <Textarea
                  placeholder="Treatment plan, medications, follow-up..."
                  rows={2}
                  value={soapNoteData.plan}
                  onChange={(e) => setSoapNoteData({ ...soapNoteData, plan: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf_with_qr">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          PDF with QR Code
                        </div>
                      </SelectItem>
                      <SelectItem value="pdf_simple">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF (Simple)
                        </div>
                      </SelectItem>
                      <SelectItem value="hl7_v2">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4" />
                          HL7 v2.x
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Destination System (Optional)</Label>
                  <Input
                    placeholder="e.g., Baghdad Medical City EMR"
                    value={destinationSystem}
                    onChange={(e) => setDestinationSystem(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Export Purpose (Optional)</Label>
                <Input
                  placeholder="e.g., Patient referral, Medical records transfer"
                  value={exportPurpose}
                  onChange={(e) => setExportPurpose(e.target.value)}
                />
              </div>

              <Button
                onClick={handleExport}
                disabled={exportToPdfMutation.isPending || exportToHL7Mutation.isPending}
                className="w-full"
              >
                {exportToPdfMutation.isPending || exportToHL7Mutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export SOAP Note
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exports History Tab */}
        <TabsContent value="exports" className="space-y-4">
          {!exports || exports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No exports yet. Export a SOAP note to see it here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {exports.map((exp: any) => (
                <Card key={exp.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Export #{exp.exportId.substring(0, 8)}
                      </CardTitle>
                      <Badge variant={exp.status === "generated" ? "default" : "secondary"}>
                        {exp.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(exp.encounterDate).toLocaleDateString()} •{" "}
                      {exp.exportFormat.toUpperCase().replace(/_/g, " ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-sm">
                        {exp.destinationSystem && (
                          <p className="text-muted-foreground">
                            <strong>Destination:</strong> {exp.destinationSystem}
                          </p>
                        )}
                        {exp.exportPurpose && (
                          <p className="text-muted-foreground">
                            <strong>Purpose:</strong> {exp.exportPurpose}
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          <strong>Accessed:</strong> {exp.accessedCount} times
                        </p>
                        {exp.expiresAt && (
                          <p className="text-muted-foreground">
                            <strong>Expires:</strong> {new Date(exp.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(exp.fileUrl, "_blank")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Preview Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {language === "ar" ? selectedTemplate.nameAr : selectedTemplate.name}
                </DialogTitle>
                <DialogDescription>
                  {language === "ar" ? selectedTemplate.descriptionAr : selectedTemplate.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Common Symptoms */}
                {selectedTemplate.commonSymptoms && selectedTemplate.commonSymptoms.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Common Symptoms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.commonSymptoms.map((symptom: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Red Flags */}
                {selectedTemplate.redFlags && selectedTemplate.redFlags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Red Flags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.redFlags.map((flag: string, idx: number) => (
                        <Badge key={idx} variant="destructive">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template Structure */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Subjective Template</h3>
                    <Card>
                      <CardContent className="pt-4">
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(selectedTemplate.subjectiveTemplate, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Objective Template</h3>
                    <Card>
                      <CardContent className="pt-4">
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(selectedTemplate.objectiveTemplate, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Assessment Template</h3>
                    <Card>
                      <CardContent className="pt-4">
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(selectedTemplate.assessmentTemplate, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Plan Template</h3>
                    <Card>
                      <CardContent className="pt-4">
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(selectedTemplate.planTemplate, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                  Close
                </Button>
                <Button onClick={() => handleUseTemplate(selectedTemplate.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SOAPTemplates() {
  return (
    <ClinicianLayout>
      <SOAPTemplatesContent />
    </ClinicianLayout>
  );
}
