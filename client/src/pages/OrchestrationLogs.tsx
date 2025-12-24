/**
 * Orchestration Logs Viewer
 * Real-time monitoring of AI orchestration operations and workflow execution
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Calendar,
  Filter,
  Search,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type TimeRange = "today" | "week" | "month" | "all";
type StatusFilter = "all" | "started" | "in_progress" | "completed" | "failed" | "cancelled";

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

const STATUS_CONFIG = {
  started: { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Started" },
  in_progress: { icon: Activity, color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-500/10", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-500", bgColor: "bg-red-500/10", label: "Failed" },
  cancelled: { icon: AlertCircle, color: "text-gray-500", bgColor: "bg-gray-500/10", label: "Cancelled" },
};

export default function OrchestrationLogs() {
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

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
        start = new Date(0);
        break;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [timeRange]);

  // Fetch orchestration logs
  const { data: logs, isLoading, refetch } = trpc.orchestration.getMyLogs.useQuery({
    startDate,
    endDate,
    status: statusFilter === "all" ? undefined : statusFilter,
    module: moduleFilter === "all" ? undefined : moduleFilter,
    limit: 100,
  });

  // Filter logs by search query
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (!searchQuery.trim()) return logs;

    const query = searchQuery.toLowerCase();
    return logs.filter(
      (log) =>
        log.requestId.toLowerCase().includes(query) ||
        log.module.toLowerCase().includes(query) ||
        log.operation.toLowerCase().includes(query) ||
        (log.errorMessage && log.errorMessage.toLowerCase().includes(query))
    );
  }, [logs, searchQuery]);

  // Format duration
  const formatDuration = (ms: number | null) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Format timestamp
  const formatTimestamp = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  // Get status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.started;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
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

  // Calculate statistics
  const stats = useMemo(() => {
    if (!logs) return { total: 0, completed: 0, failed: 0, avgDuration: 0 };

    const completed = logs.filter((l) => l.status === "completed").length;
    const failed = logs.filter((l) => l.status === "failed").length;
    const durations = logs.filter((l) => l.durationMs).map((l) => l.durationMs!);
    const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    return {
      total: logs.length,
      completed,
      failed,
      avgDuration,
    };
  }, [logs]);

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orchestration Logs</h1>
          <p className="text-muted-foreground">
            Monitor AI orchestration operations and workflow execution in real-time
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All orchestration operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}% failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
            <p className="text-xs text-muted-foreground">Average operation time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
          <CardDescription>Refine your view with time range, status, and module filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger>
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

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="started">Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {Object.entries(MODULE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Operation Logs</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs?.length || 0} operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Request ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="text-sm">
                      {formatTimestamp(log.startedAt)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {MODULE_LABELS[log.module] || log.module}
                      </span>
                    </TableCell>
                    <TableCell>{log.operation}</TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDuration(log.durationMs)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.requestId.slice(0, 8)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No orchestration logs found for the selected filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Operation Details</DialogTitle>
            <DialogDescription>
              Detailed information about the orchestration operation
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Request ID</p>
                  <p className="font-mono text-sm">{selectedLog.requestId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <StatusBadge status={selectedLog.status} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Module</p>
                  <p className="text-sm">{MODULE_LABELS[selectedLog.module] || selectedLog.module}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Operation</p>
                  <p className="text-sm">{selectedLog.operation}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Started At</p>
                  <p className="text-sm">{formatTimestamp(selectedLog.startedAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-sm">{formatDuration(selectedLog.durationMs)}</p>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div className="rounded-lg bg-red-500/10 p-4">
                  <p className="text-sm font-medium text-red-500 mb-2">Error Message</p>
                  <p className="text-sm text-red-500/80">{selectedLog.errorMessage}</p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Metadata</p>
                  <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
