/**
 * Budget Tracking Dashboard
 * Real-time monitoring of API usage, costs, and budget limits
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Download,
} from "lucide-react";

type TimeRange = "today" | "week" | "month" | "all";

const MODULE_LABELS: Record<string, string> = {
  brain_clinical_reasoning: "BRAIN Clinical Reasoning",
  pharma_guard: "PharmaGuard",
  medical_imaging: "Medical Imaging",
  lab_results: "Lab Results",
  medical_reports: "Medical Reports",
  symptom_checker: "Symptom Checker",
  soap_notes: "SOAP Notes",
  bio_scanner: "Bio-Scanner",
  voice_transcription: "Voice Transcription",
  image_generation: "Image Generation",
  conversation_ai: "Conversation AI",
  other: "Other",
};

export default function BudgetTracking() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    let start = new Date();

    switch (timeRange) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start.setMonth(start.getMonth() - 1);
        break;
      case "all":
        start = new Date(0); // Beginning of time
        break;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [timeRange]);

  // Fetch usage statistics
  const { data: stats, isLoading, refetch } = trpc.budget.getMyUsageStats.useQuery({
    startDate,
    endDate,
  });

  // Format currency
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Calculate budget usage percentage (assuming $100 default budget limit)
  const DEFAULT_BUDGET_CENTS = 10000; // $100
  const budgetPercentage = stats
    ? Math.min((stats.totalCostCents / DEFAULT_BUDGET_CENTS) * 100, 100)
    : 0;

  // Determine budget status
  const getBudgetStatus = () => {
    if (!stats) return { color: "default", label: "Unknown" };
    if (budgetPercentage >= 100) return { color: "destructive", label: "Exceeded" };
    if (budgetPercentage >= 80) return { color: "warning", label: "Warning" };
    return { color: "success", label: "Healthy" };
  };

  const budgetStatus = getBudgetStatus();

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Tracking</h1>
          <p className="text-muted-foreground">
            Monitor your API usage, costs, and budget limits in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Budget Alert */}
      {stats && budgetPercentage >= 80 && (
        <Alert variant={budgetPercentage >= 100 ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {budgetPercentage >= 100
              ? "Budget limit exceeded! API usage may be restricted."
              : "Approaching budget limit. Consider reviewing your usage."}
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.totalCostCents) : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Budget: {formatCurrency(DEFAULT_BUDGET_CENTS)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatNumber(stats.totalRequests) : "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Success: {stats ? formatNumber(stats.successfulRequests) : "0"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatNumber(stats.totalTokens) : "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {stats ? stats.totalRequests : 0} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <Badge variant={budgetStatus.color as any}>{budgetStatus.label}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetPercentage.toFixed(1)}%</div>
            <Progress value={budgetPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Module Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Module</CardTitle>
          <CardDescription>
            Breakdown of API usage and costs across different modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats && Object.keys(stats.byModule).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(stats.byModule).map(([moduleName, moduleData]: [string, any]) => {
                  const percentage = stats.totalCostCents
                    ? (moduleData.costCents / stats.totalCostCents) * 100
                    : 0;
                  return (
                    <TableRow key={moduleName}>
                      <TableCell className="font-medium">
                        {MODULE_LABELS[moduleName] || moduleName}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(moduleData.count)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(moduleData.tokens)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(moduleData.costCents)}
                      </TableCell>
                      <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No usage data available for the selected time range
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest API usage records</CardDescription>
        </CardHeader>
        <CardContent>
          {stats && stats.records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.records.slice(0, 20).map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-sm">
                      {new Date(record.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {MODULE_LABELS[record.module] || record.module}
                    </TableCell>
                    <TableCell>{record.apiProvider}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(record.totalTokens || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(record.estimatedCostCents || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.success === "true" ? "default" : "destructive"}>
                        {record.success === "true" ? "Success" : "Failed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
