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
  RefreshCw
} from 'lucide-react';

export default function LoadTestDashboard() {
  const [totalUsers, setTotalUsers] = useState(100);
  const [patientPercentage, setPatientPercentage] = useState(70);
  const [durationSeconds, setDurationSeconds] = useState(300);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

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
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Load Testing Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Simulate concurrent users to test system performance
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure">Configure Test</TabsTrigger>
          <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
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

              {/* Response Time Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Metrics</CardTitle>
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
                </CardContent>
              </Card>

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
                    <div className="grid gap-4 md:grid-cols-4">
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
  );
}
