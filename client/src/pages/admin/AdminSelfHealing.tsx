import SecureAdminLayout from '@/components/SecureAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Activity,
  Server,
  Database,
  Cpu,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  Play,
  RotateCcw
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminSelfHealing() {
  const [selectedTimeRange, setSelectedTimeRange] = useState(24);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = 
    trpc.selfHealing.getSystemHealth.useQuery();
  
  const { data: circuitBreakers, isLoading: breakersLoading, refetch: refetchBreakers } = 
    trpc.selfHealing.getCircuitBreakers.useQuery();
  
  const { data: failureStats, isLoading: statsLoading, refetch: refetchStats } = 
    trpc.selfHealing.getFailureStats.useQuery({ timeRangeHours: selectedTimeRange });
  
  const { data: recentFailures, isLoading: failuresLoading, refetch: refetchFailures } = 
    trpc.selfHealing.getRecentFailures.useQuery({ 
      limit: 20,
      severity: selectedSeverity !== 'all' ? selectedSeverity as any : undefined
    });

  const resetCircuitBreakerMutation = trpc.selfHealing.resetCircuitBreaker.useMutation({
    onSuccess: () => {
      toast.success('Circuit breaker reset successfully');
      refetchBreakers();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const triggerRecoveryMutation = trpc.selfHealing.triggerRecoveryAction.useMutation({
    onSuccess: (result) => {
      toast.success(result.message || 'Recovery action triggered');
      refetchHealth();
      refetchFailures();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const sendTestAlertMutation = trpc.selfHealing.sendTestAlert.useMutation({
    onSuccess: () => {
      toast.success('Test alert sent');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleRefreshAll = () => {
    refetchHealth();
    refetchBreakers();
    refetchStats();
    refetchFailures();
    toast.success('Data refreshed');
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
      default: return 'text-slate-400';
    }
  };

  const getHealthBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/10';
      case 'degraded': return 'bg-yellow-500/10';
      case 'unhealthy': return 'bg-red-500/10';
      default: return 'bg-slate-500/10';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getCircuitStateBadge = (state: string) => {
    switch (state) {
      case 'closed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Closed</Badge>;
      case 'open':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Open</Badge>;
      case 'half-open':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Half-Open</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };

  const isLoading = healthLoading || breakersLoading || statsLoading || failuresLoading;

  return (
    <SecureAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Zap className="h-6 w-6 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white">Self-Healing System</h1>
            </div>
            <p className="text-slate-400">Monitor system health and automatic recovery mechanisms</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshAll}
            disabled={isLoading}
            className="border-slate-700 text-slate-300"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh All
          </Button>
        </div>

        {/* System Health Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">System Status</CardTitle>
              <Shield className={`h-5 w-5 ${getHealthColor(systemHealth?.overall || 'unknown')}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold capitalize ${getHealthColor(systemHealth?.overall || 'unknown')}`}>
                {systemHealth?.overall || 'Unknown'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Overall system health
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Failures</CardTitle>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {failureStats?.unresolved || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Unresolved issues
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Resolution Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {failureStats?.resolutionRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Auto-resolved in {selectedTimeRange}h
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Events</CardTitle>
              <Activity className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {failureStats?.total || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                In last {selectedTimeRange} hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Severity Breakdown */}
        {failureStats && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Failure Severity Distribution</CardTitle>
              <CardDescription className="text-slate-400">
                Breakdown of failures by severity level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-400">{failureStats.bySeverity.critical}</div>
                  <div className="text-sm text-slate-400 mt-1">Critical</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-orange-400">{failureStats.bySeverity.high}</div>
                  <div className="text-sm text-slate-400 mt-1">High</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-yellow-400">{failureStats.bySeverity.medium}</div>
                  <div className="text-sm text-slate-400 mt-1">Medium</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-400">{failureStats.bySeverity.low}</div>
                  <div className="text-sm text-slate-400 mt-1">Low</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="circuit-breakers" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="circuit-breakers" className="data-[state=active]:bg-slate-700">
              Circuit Breakers
            </TabsTrigger>
            <TabsTrigger value="failures" className="data-[state=active]:bg-slate-700">
              Recent Failures
            </TabsTrigger>
            <TabsTrigger value="recovery" className="data-[state=active]:bg-slate-700">
              Recovery Actions
            </TabsTrigger>
          </TabsList>

          {/* Circuit Breakers Tab */}
          <TabsContent value="circuit-breakers">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-500" />
                  Circuit Breakers
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Monitor and manage service circuit breakers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {circuitBreakers && Object.keys(circuitBreakers).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(circuitBreakers).map(([name, state]: [string, any]) => (
                      <div 
                        key={name}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-800 border border-slate-700"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            state.state === 'closed' ? 'bg-green-500/10' :
                            state.state === 'open' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                          }`}>
                            {state.state === 'closed' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : state.state === 'open' ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{name}</span>
                              {getCircuitStateBadge(state.state)}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              Failures: {state.failureCount || 0} | 
                              Success: {state.successCount || 0}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {state.state !== 'closed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resetCircuitBreakerMutation.mutate({ circuitName: name })}
                              disabled={resetCircuitBreakerMutation.isPending}
                              className="border-slate-700 text-slate-300"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No circuit breakers registered</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Failures Tab */}
          <TabsContent value="failures">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Recent Failures
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      System failure events and their status
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                      <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={selectedTimeRange.toString()} 
                      onValueChange={(v) => setSelectedTimeRange(Number(v))}
                    >
                      <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Time Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Last 1 hour</SelectItem>
                        <SelectItem value="6">Last 6 hours</SelectItem>
                        <SelectItem value="24">Last 24 hours</SelectItem>
                        <SelectItem value="72">Last 3 days</SelectItem>
                        <SelectItem value="168">Last 7 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recentFailures && recentFailures.length > 0 ? (
                  <div className="space-y-3">
                    {recentFailures.map((failure: any) => (
                      <div 
                        key={failure.id}
                        className={`p-4 rounded-lg border ${
                          failure.resolved 
                            ? 'bg-slate-800/50 border-slate-700' 
                            : 'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getSeverityBadge(failure.severity)}
                              <span className="text-sm font-medium text-white">
                                {failure.failureCategory}
                              </span>
                              {failure.resolved && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 mb-2">{failure.message}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(failure.timestamp).toLocaleString()}
                              </span>
                              <span>Service: {failure.serviceName}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                    <p>No failures in the selected time range</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recovery Actions Tab */}
          <TabsContent value="recovery">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Manual Recovery Actions
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Trigger recovery actions manually
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { action: 'restart_service', label: 'Restart Service', icon: RefreshCw, color: 'blue' },
                    { action: 'clear_cache', label: 'Clear Cache', icon: Database, color: 'purple' },
                    { action: 'cleanup_memory', label: 'Cleanup Memory', icon: Cpu, color: 'green' },
                    { action: 'reconnect_database', label: 'Reconnect DB', icon: Database, color: 'yellow' },
                    { action: 'throttle_requests', label: 'Throttle Requests', icon: Activity, color: 'orange' },
                    { action: 'reset_circuit_breaker', label: 'Reset All Breakers', icon: RotateCcw, color: 'red' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.action}
                        variant="outline"
                        className={`h-auto p-4 flex flex-col items-center gap-2 border-slate-700 hover:bg-slate-800`}
                        onClick={() => triggerRecoveryMutation.mutate({
                          serviceName: 'system',
                          actionType: item.action as any,
                        })}
                        disabled={triggerRecoveryMutation.isPending}
                      >
                        <Icon className={`h-6 w-6 text-${item.color}-500`} />
                        <span className="text-sm text-slate-300">{item.label}</span>
                      </Button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h4 className="text-sm font-medium text-white mb-3">Test Alerts</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendTestAlertMutation.mutate({ 
                        type: 'critical_failure',
                        message: 'Test critical failure alert'
                      })}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      Test Critical Alert
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendTestAlertMutation.mutate({ 
                        type: 'circuit_breaker_open',
                        serviceName: 'test-service'
                      })}
                      className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      Test Circuit Breaker Alert
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SecureAdminLayout>
  );
}
