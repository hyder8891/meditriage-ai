import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Play,
  Square,
  Trash2,
  RefreshCw,
  Target,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminLayout } from '@/components/AdminLayout';

export default function LoadTestDashboard() {
  const [totalUsers, setTotalUsers] = useState(100);
  const [patientPercentage, setPatientPercentage] = useState(70);
  const [durationSeconds, setDurationSeconds] = useState(300);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [testCaseFilter, setTestCaseFilter] = useState<'all' | 'success' | 'failed' | 'running' | 'pending'>('all');

  const startTestMutation = trpc.loadTest.startTest.useMutation();
  const stopTestMutation = trpc.loadTest.stopTest.useMutation();
  const deleteTestMutation = trpc.loadTest.deleteTest.useMutation();
  const testsQuery = trpc.loadTest.listTests.useQuery(undefined, {
    refetchInterval: autoRefresh ? 2000 : false,
  });
  const statusQuery = trpc.loadTest.getTestStatus.useQuery(
    { sessionId: activeSessionId! },
    { 
      enabled: !!activeSessionId,
      refetchInterval: activeSessionId ? 1000 : false,
    }
  );
  const testCasesQuery = trpc.loadTest.getTestCases.useQuery(
    { 
      sessionId: activeSessionId!, 
      limit: 50,
      offset: 0,
      filter: testCaseFilter 
    },
    { 
      enabled: !!activeSessionId,
      refetchInterval: activeSessionId ? 2000 : false,
    }
  );

  const handleStartTest = async () => {
    try {
      const result = await startTestMutation.mutateAsync({
        totalUsers,
        patientPercentage,
        durationSeconds,
      });
      setActiveSessionId(result.sessionId);
      setAutoRefresh(true);
      testsQuery.refetch();
    } catch (error) {
      console.error('Failed to start test:', error);
    }
  };

  const handleStopTest = async () => {
    if (!activeSessionId) return;
    try {
      await stopTestMutation.mutateAsync({ sessionId: activeSessionId });
      setAutoRefresh(false);
      testsQuery.refetch();
    } catch (error) {
      console.error('Failed to stop test:', error);
    }
  };

  const handleDeleteTest = async (sessionId: string) => {
    try {
      await deleteTestMutation.mutateAsync({ sessionId });
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setAutoRefresh(false);
      }
      testsQuery.refetch();
    } catch (error) {
      console.error('Failed to delete test:', error);
    }
  };

  const patientCount = Math.floor(totalUsers * patientPercentage / 100);
  const doctorCount = totalUsers - patientCount;

  const currentTest = statusQuery.data;
  const isRunning = currentTest?.status === 'running';

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Load Testing Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Simulate concurrent users to test system performance and accuracy
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => testsQuery.refetch()}
          disabled={testsQuery.isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${testsQuery.isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="configure" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configure">Configure Test</TabsTrigger>
          <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
          <TabsTrigger value="details">Test Details</TabsTrigger>
          <TabsTrigger value="history">Test History</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Configuration</CardTitle>
              <CardDescription>
                Configure the load test parameters and start simulation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total Users */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="totalUsers">Total Concurrent Users</Label>
                  <span className="text-2xl font-bold text-primary">{totalUsers}</span>
                </div>
                <Slider
                  id="totalUsers"
                  min={10}
                  max={2000}
                  step={10}
                  value={[totalUsers]}
                  onValueChange={(value) => setTotalUsers(value[0])}
                  disabled={isRunning}
                />
                <p className="text-sm text-muted-foreground">
                  Number of virtual users to simulate concurrently
                </p>
              </div>

              {/* Patient/Doctor Mix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="patientPercentage">User Type Distribution</Label>
                  <div className="flex gap-4">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      👤 {patientCount} Patients ({patientPercentage}%)
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      👨‍⚕️ {doctorCount} Doctors ({100 - patientPercentage}%)
                    </Badge>
                  </div>
                </div>
                <Slider
                  id="patientPercentage"
                  min={0}
                  max={100}
                  step={5}
                  value={[patientPercentage]}
                  onValueChange={(value) => setPatientPercentage(value[0])}
                  disabled={isRunning}
                />
                <p className="text-sm text-muted-foreground">
                  Percentage of users simulating patient workflows vs doctor workflows
                </p>
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="duration">Test Duration</Label>
                  <span className="text-lg font-semibold">
                    {Math.floor(durationSeconds / 60)}m {durationSeconds % 60}s
                  </span>
                </div>
                <Slider
                  id="duration"
                  min={30}
                  max={1800}
                  step={30}
                  value={[durationSeconds]}
                  onValueChange={(value) => setDurationSeconds(value[0])}
                  disabled={isRunning}
                />
                <p className="text-sm text-muted-foreground">
                  How long the test should run (30 seconds to 30 minutes)
                </p>
              </div>

              {/* Test Summary */}
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <strong>Test Summary:</strong> This will simulate {totalUsers} concurrent users 
                  ({patientCount} patients + {doctorCount} doctors) for {Math.floor(durationSeconds / 60)} minutes. 
                  Users will be gradually ramped up over the first half of the test duration.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleStartTest}
                  disabled={isRunning || startTestMutation.isPending}
                  className="flex-1"
                  size="lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {startTestMutation.isPending ? 'Starting...' : 'Start Load Test'}
                </Button>
                {isRunning && (
                  <Button
                    onClick={handleStopTest}
                    disabled={stopTestMutation.isPending}
                    variant="destructive"
                    size="lg"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Test
                  </Button>
                )}
              </div>

              {startTestMutation.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {startTestMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          {!currentTest ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No active test. Start a test from the Configure tab.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress Bar */}
              {isRunning && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
                      Test Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Completion</span>
                      <span className="text-2xl font-bold text-primary">{currentTest.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={currentTest.progress} className="h-3" />
                    <p className="text-sm text-muted-foreground text-center">
                      {currentTest.metrics.totalRequests} requests completed • {currentTest.metrics.activeUsers} active users
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Status Overview */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {currentTest.status === 'running' && (
                        <>
                          <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                          <span className="text-2xl font-bold text-blue-500">Running</span>
                        </>
                      )}
                      {currentTest.status === 'completed' && (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-2xl font-bold text-green-500">Completed</span>
                        </>
                      )}
                      {currentTest.status === 'failed' && (
                        <>
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="text-2xl font-bold text-red-500">Failed</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold">{currentTest.metrics.activeUsers}</span>
                      <span className="text-sm text-muted-foreground">
                        / {currentTest.config.totalUsers}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold">{currentTest.metrics.totalRequests}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-2xl font-bold">
                        {currentTest.metrics.stats.successRate.toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Accuracy Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Accuracy Metrics
                  </CardTitle>
                  <CardDescription>
                    AI response validation and accuracy statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {(currentTest.accuracyMetrics.accuracy * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Precision</p>
                      <p className="text-2xl font-bold">
                        {(currentTest.accuracyMetrics.precision * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Recall</p>
                      <p className="text-2xl font-bold">
                        {(currentTest.accuracyMetrics.recall * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">F1 Score</p>
                      <p className="text-2xl font-bold">
                        {(currentTest.accuracyMetrics.f1Score * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 pt-4 border-t">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-900">True Positives</span>
                      <span className="text-xl font-bold text-green-700">
                        {currentTest.accuracyMetrics.truePositives}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-900">True Negatives</span>
                      <span className="text-xl font-bold text-blue-700">
                        {currentTest.accuracyMetrics.trueNegatives}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium text-orange-900">False Positives</span>
                      <span className="text-xl font-bold text-orange-700">
                        {currentTest.accuracyMetrics.falsePositives}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-red-900">False Negatives</span>
                      <span className="text-xl font-bold text-red-700">
                        {currentTest.accuracyMetrics.falseNegatives}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Time Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Response Time Metrics
                  </CardTitle>
                  <CardDescription>
                    Performance statistics for all requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Average</p>
                      <p className="text-2xl font-bold">
                        {currentTest.metrics.stats.avgResponseTime.toFixed(0)}ms
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Median (p50)</p>
                      <p className="text-2xl font-bold">
                        {currentTest.metrics.stats.medianResponseTime.toFixed(0)}ms
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">95th Percentile</p>
                      <p className="text-2xl font-bold">
                        {currentTest.metrics.stats.p95ResponseTime.toFixed(0)}ms
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Min: {currentTest.metrics.stats.minResponseTime.toFixed(0)}ms</span>
                      <span>Max: {currentTest.metrics.stats.maxResponseTime.toFixed(0)}ms</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (currentTest.metrics.stats.avgResponseTime / 10000) * 100)} 
                    />
                  </div>

                  {/* Response Time Distribution */}
                  <div className="pt-4 border-t space-y-3">
                    <h4 className="font-semibold text-sm">Response Time Distribution</h4>
                    {Object.entries(currentTest.metrics.responseTimeDistribution).map(([range, count]) => {
                      const total = Object.values(currentTest.metrics.responseTimeDistribution).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={range} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{range}</span>
                            <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Test Execution Timeline */}
              {currentTest.milestones && currentTest.milestones.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-indigo-500" />
                      Test Execution Timeline
                    </CardTitle>
                    <CardDescription>
                      Key milestones during test execution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentTest.milestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <div className={`mt-1 h-3 w-3 rounded-full ${
                            milestone.type === 'start' ? 'bg-blue-500' :
                            milestone.type === 'wave' ? 'bg-purple-500' :
                            milestone.type === 'halfway' ? 'bg-yellow-500' :
                            milestone.type === 'complete' ? 'bg-green-500' :
                            'bg-red-500'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{milestone.message}</p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(milestone.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <Progress value={milestone.progress} className="h-1 mt-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Metrics */}
              {currentTest.metrics.failedRequests > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Error Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Failed Requests</span>
                        <Badge variant="destructive">
                          {currentTest.metrics.failedRequests} ({currentTest.metrics.stats.errorRate.toFixed(2)}%)
                        </Badge>
                      </div>
                      {Object.entries(currentTest.metrics.errorsByType).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Live Logs */}
              <Card>
                <CardHeader>
                  <CardTitle>Live Logs</CardTitle>
                  <CardDescription>
                    Recent test events and messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-sm">
                    {currentTest.logs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No logs yet</p>
                    ) : (
                      currentTest.logs.map((log, idx) => (
                        <div 
                          key={idx}
                          className={`p-2 rounded ${
                            log.level === 'error' ? 'bg-red-50 text-red-900' :
                            log.level === 'warning' ? 'bg-yellow-50 text-yellow-900' :
                            'bg-muted text-foreground'
                          }`}
                        >
                          <span className="text-muted-foreground">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>{' '}
                          {log.message}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {!currentTest ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No active test. Start a test from the Configure tab.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Test Case Details</CardTitle>
                      <CardDescription>
                        Individual test case results and accuracy validation
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={testCaseFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTestCaseFilter('all')}
                      >
                        All
                      </Button>
                      <Button
                        variant={testCaseFilter === 'success' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTestCaseFilter('success')}
                      >
                        Success
                      </Button>
                      <Button
                        variant={testCaseFilter === 'failed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTestCaseFilter('failed')}
                      >
                        Failed
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {testCasesQuery.isLoading ? (
                    <div className="py-12 text-center">
                      <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Loading test cases...</p>
                    </div>
                  ) : testCasesQuery.data?.cases.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">No test cases yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">ID</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Response Time</TableHead>
                              <TableHead>Accuracy</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {testCasesQuery.data?.cases.map((testCase) => (
                              <TableRow key={testCase.id}>
                                <TableCell className="font-mono text-xs">
                                  {testCase.id.substring(0, 12)}...
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    testCase.type === 'patient' 
                                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                      : 'bg-green-50 text-green-700 border-green-200'
                                  }>
                                    {testCase.type === 'patient' ? '👤 Patient' : '👨‍⚕️ Doctor'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {testCase.status === 'success' && (
                                    <Badge variant="default" className="bg-green-500">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Success
                                    </Badge>
                                  )}
                                  {testCase.status === 'failed' && (
                                    <Badge variant="destructive">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Failed
                                    </Badge>
                                  )}
                                  {testCase.status === 'running' && (
                                    <Badge variant="default" className="bg-blue-500">
                                      <Activity className="h-3 w-3 mr-1 animate-pulse" />
                                      Running
                                    </Badge>
                                  )}
                                  {testCase.status === 'pending' && (
                                    <Badge variant="outline">
                                      Pending
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {testCase.responseTime ? (
                                    <span className="font-medium">{testCase.responseTime.toFixed(0)}ms</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {testCase.isCorrect !== undefined ? (
                                    testCase.isCorrect ? (
                                      <Badge variant="default" className="bg-green-500">
                                        ✓ Correct
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">
                                        ✗ Incorrect
                                      </Badge>
                                    )
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm">
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {testCasesQuery.data?.hasMore && (
                        <div className="text-center">
                          <Button variant="outline" size="sm">
                            Load More ({testCasesQuery.data.total - testCasesQuery.data.cases.length} remaining)
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {testsQuery.isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading test history...</p>
              </CardContent>
            </Card>
          ) : testsQuery.data?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No tests yet. Start your first load test!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {testsQuery.data?.map((test) => (
                <Card key={test.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">
                          {test.config.totalUsers} Users Test
                        </CardTitle>
                        {test.status === 'running' && (
                          <Badge variant="default" className="bg-blue-500">
                            <Activity className="h-3 w-3 mr-1 animate-pulse" />
                            Running
                          </Badge>
                        )}
                        {test.status === 'completed' && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {test.status === 'failed' && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveSessionId(test.id)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTest(test.id)}
                          disabled={deleteTestMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Started: {new Date(test.startTime).toLocaleString()}
                      {test.endTime && ` • Ended: ${new Date(test.endTime).toLocaleString()}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-5">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Requests</p>
                        <p className="text-xl font-bold">{test.totalRequests}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                        <p className="text-xl font-bold text-green-600">
                          {test.successRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                        <p className="text-xl font-bold text-purple-600">
                          {(test.accuracyMetrics.accuracy * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="text-xl font-bold">
                          {test.config.durationSeconds}s
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">User Mix</p>
                        <p className="text-sm">
                          {test.config.patientPercentage}% patients, 
                          {' '}{100 - test.config.patientPercentage}% doctors
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </AdminLayout>
  );
}
