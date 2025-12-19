/**
 * BRAIN Training Dashboard
 * Comprehensive training management and monitoring interface
 */

import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Download,
  Settings,
  BarChart3,
  Target,
  Zap,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function TrainingDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');
  const [isTraining, setIsTraining] = useState(false);

  // Queries
  const { data: performanceMetrics, refetch: refetchMetrics } = trpc.training.getPerformanceMetrics.useQuery({
    period: selectedPeriod
  });

  const { data: recommendations } = trpc.training.getOptimizationRecommendations.useQuery();
  const { data: trainingHistory } = trpc.training.getTrainingHistory.useQuery({ limit: 10 });
  const { data: schedulerStatus } = trpc.training.getSchedulerStatus.useQuery();
  const { data: trainingStats } = trpc.training.getTrainingStats.useQuery();

  // Mutations
  const startTrainingMutation = trpc.training.startTraining.useMutation({
    onSuccess: () => {
      toast.success('Training session completed successfully!');
      setIsTraining(false);
      refetchMetrics();
    },
    onError: (error: any) => {
      toast.error(`Training failed: ${error.message}`);
      setIsTraining(false);
    }
  });

  const [shouldExport, setShouldExport] = useState(false);
  
  const { data: exportData } = trpc.training.exportPerformanceReport.useQuery(
    { period: selectedPeriod },
    { enabled: shouldExport }
  );

  // Handle export when data is available
  if (shouldExport && exportData) {
    const blob = new Blob([exportData.report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brain-performance-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Performance report exported!');
    setShouldExport(false);
  }

  const handleStartTraining = () => {
    setIsTraining(true);
    startTrainingMutation.mutate();
  };

  const handleExportReport = () => {
    setShouldExport(true);
  };

  // Chart colors
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-600" />
              BRAIN Training Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Continuous learning and performance optimization
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleExportReport}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button
              onClick={handleStartTraining}
              disabled={isTraining || startTrainingMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {isTraining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Training
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overall Accuracy</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {performanceMetrics ? (performanceMetrics.overall.accuracy * 100).toFixed(1) : '--'}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cases</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {performanceMetrics?.overall.totalCases || 0}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">F1 Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {performanceMetrics ? (performanceMetrics.overall.f1Score * 100).toFixed(1) : '--'}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Training Sessions</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {trainingStats?.total_sessions || 0}
                  </p>
                </div>
                <Zap className="w-8 h-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(['day', 'week', 'month', 'all'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'day' ? 'Last 24h' : period === 'week' ? 'Last Week' : period === 'month' ? 'Last Month' : 'All Time'}
            </Button>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="history">Training History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Accuracy Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Accuracy Trend</CardTitle>
                <CardDescription>Model accuracy over time</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceMetrics?.trends.accuracyTrend && performanceMetrics.trends.accuracyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceMetrics.trends.accuracyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                      <Tooltip formatter={(value: any) => `${(value * 100).toFixed(1)}%`} />
                      <Legend />
                      <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} name="Accuracy" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Case Volume Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Case Volume</CardTitle>
                <CardDescription>Number of cases analyzed per day</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceMetrics?.trends.volumeTrend && performanceMetrics.trends.volumeTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceMetrics.trends.volumeTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cases" fill="#3b82f6" name="Cases" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No volume data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Error Analysis</CardTitle>
                <CardDescription>Breakdown of diagnostic errors</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceMetrics?.errorAnalysis ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">Missed Diagnoses</p>
                      <p className="text-2xl font-bold text-red-600">
                        {performanceMetrics.errorAnalysis.missedDiagnoses}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Incorrect Ranking</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {performanceMetrics.errorAnalysis.incorrectRanking}
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Low Confidence</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {performanceMetrics.errorAnalysis.lowConfidence}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No error data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            {/* Performance by Condition */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Condition</CardTitle>
                <CardDescription>Accuracy for different medical conditions</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceMetrics?.byCondition && performanceMetrics.byCondition.length > 0 ? (
                  <div className="space-y-3">
                    {performanceMetrics.byCondition.slice(0, 10).map((condition: any, index: number) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{condition.condition}</span>
                            <span className="text-sm text-gray-600">
                              {(condition.accuracy * 100).toFixed(1)}% ({condition.caseCount} cases)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                condition.accuracy >= 0.8 ? 'bg-green-500' :
                                condition.accuracy >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${condition.accuracy * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No condition data available</div>
                )}
              </CardContent>
            </Card>

            {/* Performance by Demographics */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Age Group</CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceMetrics?.byDemographic.byAge && performanceMetrics.byDemographic.byAge.length > 0 ? (
                    <div className="space-y-3">
                      {performanceMetrics.byDemographic.byAge.map((group: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{group.ageGroup}</span>
                          <Badge variant={group.accuracy >= 0.8 ? 'default' : 'secondary'}>
                            {(group.accuracy * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">No age data available</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance by Gender</CardTitle>
                </CardHeader>
                <CardContent>
                  {performanceMetrics?.byDemographic.byGender && performanceMetrics.byDemographic.byGender.length > 0 ? (
                    <div className="space-y-3">
                      {performanceMetrics.byDemographic.byGender.map((group: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{group.gender}</span>
                          <Badge variant={group.accuracy >= 0.8 ? 'default' : 'secondary'}>
                            {(group.accuracy * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">No gender data available</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec: any, index: number) => (
                <Alert key={index} className={
                  rec.priority === 'high' ? 'border-red-200 bg-red-50' :
                  rec.priority === 'medium' ? 'border-orange-200 bg-orange-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <AlertTriangle className={`h-4 w-4 ${
                    rec.priority === 'high' ? 'text-red-600' :
                    rec.priority === 'medium' ? 'text-orange-600' :
                    'text-blue-600'
                  }`} />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={rec.priority === 'high' ? 'destructive' : 'default'}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{rec.category}</Badge>
                      </div>
                      <p className="font-semibold">{rec.issue}</p>
                      <p className="text-sm">{rec.recommendation}</p>
                      <p className="text-sm text-gray-600">Expected impact: {rec.expectedImpact}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>No optimization recommendations at this time.</p>
                    <p className="text-sm">System is performing well!</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Training History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Training Sessions</CardTitle>
                <CardDescription>History of automated and manual training runs</CardDescription>
              </CardHeader>
              <CardContent>
                {trainingHistory && Array.isArray(trainingHistory) && trainingHistory.length > 0 ? (
                  <div className="space-y-3">
                    {trainingHistory.map((session: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={session.status === 'completed' ? 'default' : 'destructive'}>
                              {session.status}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(session.start_time).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.improvement_rate > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-sm font-semibold ${
                              session.improvement_rate > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {session.improvement_rate > 0 ? '+' : ''}{session.improvement_rate?.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Cases Processed</p>
                            <p className="font-semibold">{session.cases_processed}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Accuracy Before</p>
                            <p className="font-semibold">{(session.accuracy_before * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Accuracy After</p>
                            <p className="font-semibold">{(session.accuracy_after * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No training history available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Training Scheduler</CardTitle>
                <CardDescription>Configure automated training schedule</CardDescription>
              </CardHeader>
              <CardContent>
                {schedulerStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">Status</p>
                        <p className="text-sm text-gray-600">
                          {schedulerStatus.isRunning ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <Badge variant={schedulerStatus.isRunning ? 'default' : 'secondary'}>
                        {schedulerStatus.isRunning ? 'Running' : 'Stopped'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold">Frequency</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {schedulerStatus.config.frequency}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold">Min New Cases</p>
                        <p className="text-sm text-gray-600">
                          {schedulerStatus.config.minNewCases}
                        </p>
                      </div>
                    </div>
                    {schedulerStatus.nextTrainingCheck && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <p className="text-sm">
                            Next training check: {new Date(schedulerStatus.nextTrainingCheck).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">Loading scheduler status...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
