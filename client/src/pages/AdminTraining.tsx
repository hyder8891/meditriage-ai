import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Brain, 
  FileText, 
  Database, 
  TrendingUp,
  Shield,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminTraining() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [trainingProgress, setTrainingProgress] = useState<{
    isTraining: boolean;
    current: number;
    total: number;
    currentFile: string;
    percentage: number;
  }>({ isTraining: false, current: 0, total: 0, currentFile: '', percentage: 0 });

  const { data: trainingMaterials, isLoading: materialsLoading, refetch: refetchMaterials } = 
    trpc.training.getAllMaterials.useQuery(undefined, { enabled: isAuthenticated && user?.role === 'admin' });

  const { data: trainingData, isLoading: dataLoading } = 
    trpc.training.getAllTrainingData.useQuery(undefined, { enabled: isAuthenticated && user?.role === 'admin' });

  const batchMutation = trpc.training.batchProcess.useMutation({
    onSuccess: (data) => {
      toast.success(`Batch complete: ${data.successful}/${data.totalProcessed} files processed`);
      refetchMaterials();
      setUploadingFiles(false);
    },
    onError: (error) => {
      toast.error('Batch processing failed: ' + error.message);
      setUploadingFiles(false);
    },
  });

  const uploadMutation = trpc.training.addMaterial.useMutation({
    onSuccess: () => {
      toast.success('Training material added successfully');
      refetchMaterials();
    },
    onError: (error) => {
      toast.error('Failed to add material: ' + error.message);
    },
  });

  const trainAllMutation = trpc.training.trainAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Training complete! ${data.successful}/${data.totalMaterials} materials processed`);
      refetchMaterials();
      setUploadingFiles(false);
      setTrainingProgress({ isTraining: false, current: 0, total: 0, currentFile: '', percentage: 0 });
    },
    onError: (error) => {
      toast.error('Training failed: ' + error.message);
      setUploadingFiles(false);
      setTrainingProgress({ isTraining: false, current: 0, total: 0, currentFile: '', percentage: 0 });
    },
  });

  const handleTrainModel = async () => {
    if (!trainingMaterials || trainingMaterials.length === 0) {
      toast.error('No training materials available. Please upload medical materials first.');
      return;
    }
    
    setUploadingFiles(true);
    setTrainingProgress({
      isTraining: true,
      current: 0,
      total: trainingMaterials.length,
      currentFile: '',
      percentage: 0,
    });
    toast.info('Starting model training on all materials...');
    
    // Simulate progress updates (in real implementation, this would come from backend)
    const materials = trainingMaterials;
    for (let i = 0; i < materials.length; i++) {
      setTrainingProgress({
        isTraining: true,
        current: i + 1,
        total: materials.length,
        currentFile: materials[i].title,
        percentage: Math.round(((i + 1) / materials.length) * 100),
      });
      
      // Small delay to show progress (remove in production)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    trainAllMutation.mutate();
  };

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-5 w-5" />
          <AlertDescription>
            Access denied. Admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);

    try {
      for (const file of Array.from(files)) {
        const content = await file.text();
        
        await uploadMutation.mutateAsync({
          title: file.name,
          category: selectedCategory,
          source: "Manual Upload",
          content,
        });
      }

      toast.success(`Successfully uploaded ${files.length} file(s)`);
      refetchMaterials();
      
      // Reset input
      event.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const categories = [
    { value: "general", label: "General Medicine" },
    { value: "cardiology", label: "Cardiology" },
    { value: "neurology", label: "Neurology" },
    { value: "radiology", label: "Radiology" },
    { value: "pharmacology", label: "Pharmacology" },
    { value: "emergency", label: "Emergency Medicine" },
    { value: "pediatrics", label: "Pediatrics" },
    { value: "methodology", label: "Clinical Methodology" },
  ];

  const stats = {
    totalMaterials: trainingMaterials?.length || 0,
    processedMaterials: trainingMaterials?.filter(m => m.trainingStatus === 'processed').length || 0,
    totalTriageData: trainingData?.length || 0,
    trainedData: trainingData?.filter(d => d.usedForTraining).length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card p-4">
        <div className="container max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/admin')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                AI Training Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Medical Knowledge & Model Training</p>
            </div>
          </div>
          <Badge variant="secondary">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-7xl py-8 space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Training Materials</CardDescription>
              <CardTitle className="text-3xl">{stats.totalMaterials}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="w-4 h-4 mr-1" />
                {stats.processedMaterials} processed
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Triage Data</CardDescription>
              <CardTitle className="text-3xl">{stats.totalTriageData}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Database className="w-4 h-4 mr-1" />
                {stats.trainedData} used for training
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Processing Rate</CardDescription>
              <CardTitle className="text-3xl">
                {stats.totalMaterials > 0 
                  ? Math.round((stats.processedMaterials / stats.totalMaterials) * 100)
                  : 0}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1" />
                Materials processed
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Model Status</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Brain className="w-4 h-4 mr-1" />
                Active & Learning
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Train Model Button */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  Train AI Model on Medical Directory
                </h3>
                <p className="text-sm text-muted-foreground">
                  Process all uploaded medical materials with DeepSeek AI to extract clinical knowledge and update the model
                </p>
              </div>
              <Button
                onClick={handleTrainModel}
                disabled={uploadingFiles || !trainingMaterials || trainingMaterials.length === 0}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploadingFiles ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Training...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Train Model
                  </>
                )}
              </Button>
            </div>
            
            {/* Progress Bar */}
            {trainingProgress.isTraining && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Processing file {trainingProgress.current} of {trainingProgress.total}
                  </span>
                  <span className="font-semibold text-blue-600">
                    {trainingProgress.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${trainingProgress.percentage}%` }}
                  />
                </div>
                {trainingProgress.currentFile && (
                  <p className="text-xs text-muted-foreground truncate">
                    <FileText className="w-3 h-3 inline mr-1" />
                    {trainingProgress.currentFile}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Interface */}
        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
            <TabsTrigger value="materials">Training Materials</TabsTrigger>
            <TabsTrigger value="triage">Triage Data</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Medical Training Data</CardTitle>
                <CardDescription>
                  Upload medical literature, methodologies, clinical guidelines, or research papers to train the AI model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <Badge
                        key={cat.value}
                        variant={selectedCategory === cat.value ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(cat.value)}
                      >
                        {cat.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept=".txt,.pdf,.md,.doc,.docx"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="training-file-upload"
                    disabled={uploadingFiles}
                  />
                  <label htmlFor="training-file-upload" className="cursor-pointer">
                    {uploadingFiles ? (
                      <>
                        <Loader2 className="w-12 h-12 mx-auto mb-3 text-primary animate-spin" />
                        <p className="font-medium">Processing files...</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Analyzing with DeepSeek AI
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-medium mb-1">Click to upload files</p>
                        <p className="text-sm text-muted-foreground">
                          TXT, PDF, MD, DOC, DOCX (multiple files supported)
                        </p>
                      </>
                    )}
                  </label>
                </div>

                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    <strong>How it works:</strong> Uploaded files are processed by DeepSeek AI to extract medical knowledge, 
                    clinical patterns, and diagnostic criteria. The processed data is stored in the cloud and used to improve 
                    the triage AI's accuracy and medical reasoning capabilities.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Training Materials Library</CardTitle>
                <CardDescription>All uploaded medical training materials</CardDescription>
              </CardHeader>
              <CardContent>
                {materialsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : !trainingMaterials || trainingMaterials.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No training materials uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trainingMaterials.map((material) => (
                      <Card key={material.id} className="hover:bg-accent/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{material.category}</Badge>
                                <Badge 
                                  variant={material.trainingStatus === 'processed' ? 'default' : 'secondary'}
                                >
                                  {material.trainingStatus}
                                </Badge>
                              </div>
                              <h3 className="font-semibold mb-1 truncate">{material.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                Source: {material.source}
                              </p>
                              {material.summary && (
                                <p className="text-sm line-clamp-2">{material.summary}</p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                              {new Date(material.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Triage Data Tab */}
          <TabsContent value="triage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Triage Training Data</CardTitle>
                <CardDescription>Real triage sessions used for model improvement</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : !trainingData || trainingData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No triage data available yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trainingData.slice(0, 20).map((data) => {
                      const symptoms = JSON.parse(data.symptoms || '[]');
                      return (
                        <Card key={data.id} className="hover:bg-accent/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{data.urgencyLevel}</Badge>
                                  {data.usedForTraining && (
                                    <Badge variant="default">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Trained
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {symptoms.slice(0, 5).map((symptom: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {symptom}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(data.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
