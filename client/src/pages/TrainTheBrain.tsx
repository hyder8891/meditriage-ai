import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Database, TrendingUp, Activity, Play, Pause, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function TrainTheBrain() {
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
  const [trainingConfig, setTrainingConfig] = useState({
    jobName: `Training_${Date.now()}`,
    jobType: "full_training" as const,
    baseModel: "gpt-4",
    totalEpochs: 3,
    batchSize: 32,
    learningRate: 0.001,
    includeRegionalData: true,
  });

  // Queries
  const { data: overview, isLoading: overviewLoading } = trpc.aiTraining.getDashboardOverview.useQuery();
  const { data: jobs, refetch: refetchJobs } = trpc.aiTraining.listTrainingJobs.useQuery();
  const { data: modelVersions } = trpc.aiTraining.listModelVersions.useQuery();
  const { data: datasetStats } = trpc.aiTraining.getDatasetStats.useQuery();
  const { data: articleStats } = trpc.aiTraining.getArticleStats.useQuery();
  const { data: regionalStats } = trpc.aiTraining.getRegionalDataStats.useQuery();

  // Mutations
  const startTraining = trpc.aiTraining.startTraining.useMutation({
    onSuccess: () => {
      toast.success("Training job started successfully!");
      setIsTrainingDialogOpen(false);
      refetchJobs();
    },
    onError: (error) => {
      toast.error(`Failed to start training: ${error.message}`);
    },
  });

  const cancelTraining = trpc.aiTraining.cancelTraining.useMutation({
    onSuccess: () => {
      toast.success("Training job cancelled");
      refetchJobs();
    },
  });

  const deployModel = trpc.aiTraining.deployModel.useMutation({
    onSuccess: () => {
      toast.success("Model deployed successfully!");
    },
  });

  const handleStartTraining = () => {
    startTraining.mutate(trainingConfig);
  };

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading training dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Brain className="h-10 w-10 text-primary" />
            Train the Brain
          </h1>
          <p className="text-muted-foreground mt-2">
            AI Model Training System for MediTriage - MENA Region Specialized
          </p>
        </div>
        <Dialog open={isTrainingDialogOpen} onOpenChange={setIsTrainingDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Play className="h-5 w-5" />
              Start New Training
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configure Training Job</DialogTitle>
              <DialogDescription>
                Set up parameters for training a new AI model on medical data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="jobName">Job Name</Label>
                <Input
                  id="jobName"
                  value={trainingConfig.jobName}
                  onChange={(e) => setTrainingConfig({ ...trainingConfig, jobName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobType">Training Type</Label>
                <Select
                  value={trainingConfig.jobType}
                  onValueChange={(value: any) => setTrainingConfig({ ...trainingConfig, jobType: value })}
                >
                  <SelectTrigger id="jobType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_training">Full Training</SelectItem>
                    <SelectItem value="incremental">Incremental Training</SelectItem>
                    <SelectItem value="fine_tuning">Fine-tuning</SelectItem>
                    <SelectItem value="evaluation">Evaluation Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseModel">Base Model</Label>
                <Select
                  value={trainingConfig.baseModel}
                  onValueChange={(value) => setTrainingConfig({ ...trainingConfig, baseModel: value })}
                >
                  <SelectTrigger id="baseModel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="epochs">Epochs</Label>
                  <Input
                    id="epochs"
                    type="number"
                    value={trainingConfig.totalEpochs}
                    onChange={(e) => setTrainingConfig({ ...trainingConfig, totalEpochs: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <Input
                    id="batchSize"
                    type="number"
                    value={trainingConfig.batchSize}
                    onChange={(e) => setTrainingConfig({ ...trainingConfig, batchSize: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="learningRate">Learning Rate</Label>
                  <Input
                    id="learningRate"
                    type="number"
                    step="0.0001"
                    value={trainingConfig.learningRate}
                    onChange={(e) => setTrainingConfig({ ...trainingConfig, learningRate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="regionalData">Include MENA Regional Data</Label>
                <Switch
                  id="regionalData"
                  checked={trainingConfig.includeRegionalData}
                  onCheckedChange={(checked) => setTrainingConfig({ ...trainingConfig, includeRegionalData: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTrainingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStartTraining} disabled={startTraining.isPending}>
                {startTraining.isPending ? "Starting..." : "Start Training"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.trainingJobs.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.trainingJobs.running || 0} running, {overview?.trainingJobs.completed || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Articles</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.articles.total.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.articles.processed.toLocaleString() || 0} processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regional Data</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.regionalData.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.regionalData.verified || 0} verified for MENA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datasets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.datasets.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.datasets.ready || 0} ready for training
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">Training Jobs</TabsTrigger>
          <TabsTrigger value="models">Model Versions</TabsTrigger>
          <TabsTrigger value="data">Data Sources</TabsTrigger>
          <TabsTrigger value="regional">Regional Data</TabsTrigger>
        </TabsList>

        {/* Training Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Training Jobs</CardTitle>
              <CardDescription>Monitor and manage AI training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {jobs && jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job: any) => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{job.jobName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {job.jobType} • {job.baseModel}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.status === "running" && (
                            <Badge variant="default" className="gap-1">
                              <Activity className="h-3 w-3 animate-spin" />
                              Running
                            </Badge>
                          )}
                          {job.status === "completed" && (
                            <Badge variant="default" className="gap-1 bg-green-500">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </Badge>
                          )}
                          {job.status === "failed" && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                          {job.status === "queued" && (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Queued
                            </Badge>
                          )}
                          {job.status === "running" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelTraining.mutate({ jobId: job.id })}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Epoch</p>
                          <p className="font-medium">{job.currentEpoch}/{job.totalEpochs}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Data Points</p>
                          <p className="font-medium">{job.totalDataPoints?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">
                            {job.duration ? `${Math.floor(job.duration / 60)}m ${job.duration % 60}s` : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No training jobs yet</p>
                  <Button className="mt-4" onClick={() => setIsTrainingDialogOpen(true)}>
                    Start First Training
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Versions Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Versions</CardTitle>
              <CardDescription>Trained models ready for deployment</CardDescription>
            </CardHeader>
            <CardContent>
              {modelVersions && modelVersions.length > 0 ? (
                <div className="space-y-4">
                  {modelVersions.map((model: any) => (
                    <div key={model.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{model.versionName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {model.versionNumber} • {model.baseModel}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {model.isActive && <Badge variant="default">Active</Badge>}
                          {!model.isActive && (
                            <Button
                              size="sm"
                              onClick={() => deployModel.mutate({ modelId: model.id })}
                            >
                              Deploy
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Accuracy</p>
                          <p className="font-medium">{(model.accuracy * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">F1 Score</p>
                          <p className="font-medium">{(model.f1Score * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Training Data</p>
                          <p className="font-medium">{model.totalTrainingData?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium">
                            {new Date(model.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No trained models yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Medical Articles</CardTitle>
                <CardDescription>PubMed and PMC literature</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Processing Progress</span>
                      <span>
                        {articleStats?.processedArticles || 0} / {articleStats?.totalArticles || 0}
                      </span>
                    </div>
                    <Progress
                      value={
                        articleStats?.totalArticles
                          ? (articleStats.processedArticles / articleStats.totalArticles) * 100
                          : 0
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Articles</p>
                      <p className="text-2xl font-bold">
                        {articleStats?.totalArticles.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Regional Relevant</p>
                      <p className="text-2xl font-bold">
                        {articleStats?.regionalArticles.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Datasets</CardTitle>
                <CardDescription>Organized data collections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Ready for Training</span>
                      <span>
                        {datasetStats?.readyDatasets || 0} / {datasetStats?.totalDatasets || 0}
                      </span>
                    </div>
                    <Progress
                      value={
                        datasetStats?.totalDatasets
                          ? (datasetStats.readyDatasets / datasetStats.totalDatasets) * 100
                          : 0
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Records</p>
                      <p className="text-2xl font-bold">
                        {datasetStats?.totalRecords.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Processed</p>
                      <p className="text-2xl font-bold">
                        {datasetStats?.processedRecords.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Regional Data Tab */}
        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MENA Regional Medical Data</CardTitle>
              <CardDescription>Iraq and Middle East specific health information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Verification Progress</span>
                    <span>
                      {regionalStats?.verifiedRecords || 0} / {regionalStats?.totalRecords || 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      regionalStats?.totalRecords
                        ? (regionalStats.verifiedRecords / regionalStats.totalRecords) * 100
                        : 0
                    }
                  />
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Data by Region</h4>
                  <div className="space-y-2">
                    {regionalStats?.byRegion &&
                      Object.entries(regionalStats.byRegion).map(([region, count]) => (
                        <div key={region} className="flex justify-between items-center">
                          <span className="capitalize">{region}</span>
                          <Badge variant="secondary">{count as number} records</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
