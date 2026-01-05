import SecureAdminLayout from '@/components/SecureAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Play, 
  Square, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function AdminLoadTesting() {
  const [totalUsers, setTotalUsers] = useState(10);
  const [patientPercentage, setPatientPercentage] = useState(70);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);

  const { data: testsList, refetch: refetchTests } = trpc.loadTest.listTests.useQuery();
  const { data: testStatus, refetch: refetchStatus } = trpc.loadTest.getTestStatus.useQuery(
    { sessionId: activeSessionId! },
    { enabled: !!activeSessionId }
  );

  const startTestMutation = trpc.loadTest.startTest.useMutation({
    onSuccess: (data) => {
      setActiveSessionId(data.sessionId);
      toast.success('Load test started');
      refetchTests();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const stopTestMutation = trpc.loadTest.stopTest.useMutation({
    onSuccess: () => {
      toast.success('Load test stopped');
      refetchTests();
      refetchStatus();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const deleteTestMutation = trpc.loadTest.deleteTest.useMutation({
    onSuccess: () => {
      toast.success('Test deleted');
      if (activeSessionId) {
        setActiveSessionId(null);
      }
      refetchTests();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // Poll for status updates when test is running
  useEffect(() => {
    if (activeSessionId && testStatus?.status === 'running') {
      const interval = setInterval(() => {
        refetchStatus();
      }, 2000);
      setPollInterval(interval as unknown as number);
      return () => clearInterval(interval);
    } else if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  }, [activeSessionId, testStatus?.status]);

  const handleStartTest = () => {
    startTestMutation.mutate({
      totalUsers,
      patientPercentage,
      durationSeconds,
    });
  };

  const handleStopTest = () => {
    if (activeSessionId) {
      stopTestMutation.mutate({ sessionId: activeSessionId });
    }
  };

  const handleDeleteTest = (sessionId: string) => {
    deleteTestMutation.mutate({ sessionId });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <SecureAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Activity className="h-6 w-6 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white">Load Testing</h1>
            </div>
            <p className="text-slate-400">Execute and monitor system load tests with AI accuracy metrics</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetchTests()}
            className="border-slate-700 text-slate-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Test Configuration */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Test Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure load test parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Total Concurrent Users</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[totalUsers]}
                    onValueChange={(v) => setTotalUsers(v[0])}
                    min={1}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={totalUsers}
                    onChange={(e) => setTotalUsers(Number(e.target.value))}
                    className="w-20 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Patient Percentage: {patientPercentage}%</Label>
                <Slider
                  value={[patientPercentage]}
                  onValueChange={(v) => setPatientPercentage(v[0])}
                  min={0}
                  max={100}
                  step={5}
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Patients: {Math.floor(totalUsers * patientPercentage / 100)}</span>
                  <span>Doctors: {totalUsers - Math.floor(totalUsers * patientPercentage / 100)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Duration (seconds)</Label>
                <Input
                  type="number"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(Number(e.target.value))}
                  min={10}
                  max={3600}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleStartTest}
                  disabled={startTestMutation.isPending || (testStatus?.status === 'running')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {startTestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Test
                </Button>
                {testStatus?.status === 'running' && (
                  <Button
                    onClick={handleStopTest}
                    disabled={stopTestMutation.isPending}
                    variant="destructive"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Metrics */}
          <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Live Metrics
                {testStatus?.status === 'running' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500 ml-2" />
                )}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Real-time test performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testStatus ? (
                <div className="space-y-6">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-white">{testStatus.progress}%</span>
                    </div>
                    <Progress value={testStatus.progress} className="h-2" />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">
                        {testStatus.metrics.totalRequests}
                      </div>
                      <div className="text-xs text-slate-400">Total Requests</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">
                        {testStatus.metrics.successfulRequests}
                      </div>
                      <div className="text-xs text-slate-400">Successful</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-400">
                        {testStatus.metrics.failedRequests}
                      </div>
                      <div className="text-xs text-slate-400">Failed</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">
                        {testStatus.metrics.stats?.avgResponseTime?.toFixed(0) || 0}ms
                      </div>
                      <div className="text-xs text-slate-400">Avg Response</div>
                    </div>
                  </div>

                  {/* Accuracy Metrics */}
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-3">AI Accuracy Metrics</h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-lg font-bold text-green-400">
                          {(testStatus.accuracyMetrics.accuracy * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-400">Accuracy</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-400">
                          {(testStatus.accuracyMetrics.precision * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-400">Precision</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-400">
                          {(testStatus.accuracyMetrics.recall * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-400">Recall</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-yellow-400">
                          {(testStatus.accuracyMetrics.f1Score * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-400">F1 Score</div>
                      </div>
                    </div>
                  </div>

                  {/* Response Time Distribution */}
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-3">Response Time Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(testStatus.metrics.responseTimeDistribution || {}).map(([range, count]) => (
                        <div key={range} className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-24">{range}</span>
                          <div className="flex-1 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ 
                                width: `${testStatus.metrics.totalRequests > 0 
                                  ? ((count as number) / testStatus.metrics.totalRequests) * 100 
                                  : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-8">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active test. Configure and start a test to see metrics.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test History */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" />
              Test History
            </CardTitle>
            <CardDescription className="text-slate-400">
              Previous load test sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testsList && testsList.length > 0 ? (
              <div className="space-y-3">
                {testsList.map((test) => (
                  <div 
                    key={test.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      activeSessionId === test.id 
                        ? 'bg-blue-500/10 border-blue-500/30' 
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        {test.status === 'running' ? (
                          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        ) : test.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {test.config.totalUsers} users
                          </span>
                          {getStatusBadge(test.status)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(test.startTime).toLocaleString()} • 
                          {test.config.patientPercentage}% patients • 
                          {test.config.durationSeconds}s duration
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-white">
                          {test.totalRequests} requests
                        </div>
                        <div className="text-xs text-green-400">
                          {test.successRate.toFixed(1)}% success
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveSessionId(test.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTest(test.id)}
                          disabled={test.status === 'running'}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No test history yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SecureAdminLayout>
  );
}
