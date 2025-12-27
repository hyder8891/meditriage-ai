/**
 * Self-Healing System Dashboard
 * 
 * Admin interface for monitoring:
 * - System health metrics
 * - Circuit breaker states
 * - Failure statistics
 * - Recovery actions
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SelfHealingDashboard() {
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system health
  const { data: healthData, refetch: refetchHealth } = trpc.selfHealing.getSystemHealth.useQuery(
    undefined,
    { refetchInterval: autoRefresh ? 5000 : false }
  );

  // Fetch circuit breaker states
  const { data: circuitStates, refetch: refetchCircuits } = trpc.selfHealing.getAllCircuitBreakerStates.useQuery(
    undefined,
    { refetchInterval: autoRefresh ? 5000 : false }
  );

  // Fetch failure statistics
  const { data: failureStats, refetch: refetchStats } = trpc.selfHealing.getFailureStats.useQuery(
    { timeRangeHours: 24 },
    { refetchInterval: autoRefresh ? 10000 : false }
  );

  // Fetch recent failures
  const { data: recentFailures } = trpc.selfHealing.getRecentFailures.useQuery(
    { limit: 10 },
    { refetchInterval: autoRefresh ? 10000 : false }
  );

  // Fetch recovery actions
  // Recovery actions - not yet implemented in router
  const recoveryActions: any[] = []; // TODO: Add getRecoveryActions endpoint

  // Manual refresh
  const handleRefresh = () => {
    refetchHealth();
    refetchCircuits();
    refetchStats();
    toast({
      title: "Refreshed",
      description: "Dashboard data updated successfully",
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
      case "closed":
      case "succeeded":
        return "bg-green-500";
      case "degraded":
      case "half-open":
      case "in_progress":
        return "bg-yellow-500";
      case "unhealthy":
      case "open":
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get severity badge variant
  const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Self-Healing System Dashboard</h1>
          <p className="text-muted-foreground">Monitor system health and recovery actions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh: {autoRefresh ? "ON" : "OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${getStatusColor((healthData as any)?.status || "unknown")}`} />
              <div className="text-2xl font-bold">{(healthData as any)?.status || "Unknown"}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall system health
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Failures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failureStats?.unresolved || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unresolved issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {failureStats?.resolutionRate ? `${failureStats.resolutionRate.toFixed(1)}%` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Circuits</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {circuitStates?.filter((c: any) => c.state === "open").length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Circuit breakers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="circuits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="circuits">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="failures">Recent Failures</TabsTrigger>
          <TabsTrigger value="recovery">Recovery Actions</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Circuit Breakers Tab */}
        <TabsContent value="circuits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Circuit Breaker States</CardTitle>
              <CardDescription>
                Monitor circuit breaker status across all services
              </CardDescription>
            </CardHeader>
            <CardContent>
              {circuitStates && circuitStates.length > 0 ? (
                <div className="space-y-4">
                  {circuitStates.map((circuit: any) => (
                    <div
                      key={circuit.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(circuit.state)}`} />
                        <div>
                          <div className="font-medium">{circuit.circuitName}</div>
                          <div className="text-sm text-muted-foreground">
                            Failures: {circuit.failureCount} | Successes: {circuit.successCount}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={circuit.state === "open" ? "destructive" : "default"}>
                          {circuit.state.toUpperCase()}
                        </Badge>
                        {circuit.nextRetryAt && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Retry: {new Date(circuit.nextRetryAt).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No circuit breakers configured
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Failures Tab */}
        <TabsContent value="failures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Failures</CardTitle>
              <CardDescription>
                Latest detected failures and issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentFailures && recentFailures.length > 0 ? (
                <div className="space-y-3">
                  {recentFailures.map((failure) => (
                    <div
                      key={failure.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityVariant(failure.severity)}>
                            {failure.severity}
                          </Badge>
                          <span className="font-medium">{failure.affectedService}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(failure.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{failure.failureType}</div>
                        <div className="text-muted-foreground">{failure.errorMessage}</div>
                      </div>
                      {failure.resolved && (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Resolved at {new Date(failure.resolvedAt!).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent failures detected
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recovery Actions Tab */}
        <TabsContent value="recovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Actions</CardTitle>
              <CardDescription>
                Automated and manual recovery attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recoveryActions && recoveryActions.length > 0 ? (
                <div className="space-y-3">
                  {recoveryActions.map((action: any) => (
                    <div
                      key={action.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          <span className="font-medium">{action.actionType}</span>
                          {action.automated && (
                            <Badge variant="outline">Automated</Badge>
                          )}
                        </div>
                        <Badge variant={action.status === "succeeded" ? "default" : "destructive"}>
                          {action.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Strategy: {action.actionStrategy}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(action.timestamp).toLocaleString()}
                        </span>
                        {action.durationMs && (
                          <span className="text-muted-foreground">
                            Duration: {action.durationMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recovery actions recorded
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Failure Statistics (24h)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Failures</span>
                  <span className="text-2xl font-bold">{failureStats?.total || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Resolved</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{failureStats?.resolved || 0}</span>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{failureStats?.unresolved || 0}</span>
                    {(failureStats?.unresolved || 0) > 0 && (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Resolution Rate</span>
                  <span className="text-2xl font-bold">
                    {failureStats?.resolutionRate ? `${failureStats.resolutionRate.toFixed(1)}%` : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Failure by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {failureStats?.byCategory && Object.entries(failureStats.byCategory).length > 0 ? (
                  Object.entries(failureStats.byCategory).map(([category, count]: [string, any]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm">{category}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No failures by category
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
