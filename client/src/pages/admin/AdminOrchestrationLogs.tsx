import SecureAdminLayout from '@/components/SecureAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Search,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Filter,
  ChevronDown,
  ChevronRight,
  Zap,
  TrendingUp
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { toast } from 'sonner';

const MODULES = [
  'brain_clinical_reasoning',
  'pharma_guard',
  'medical_imaging',
  'lab_results',
  'medical_reports',
  'symptom_checker',
  'soap_notes',
  'bio_scanner',
  'voice_transcription',
  'conversation_ai',
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'started', label: 'Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrchestrationLogs() {
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Get date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (dateRange) {
      case '1h':
        start.setHours(start.getHours() - 1);
        break;
      case '24h':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const { startDate, endDate } = getDateRange();

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = 
    trpc.orchestration.getMyLogs.useQuery({
      startDate,
      endDate,
      module: selectedModule !== 'all' ? selectedModule : undefined,
      status: selectedStatus !== 'all' ? selectedStatus as any : undefined,
      limit: 100,
    });

  const { data: systemStats, isLoading: statsLoading, refetch: refetchStats } = 
    trpc.orchestration.getSystemStats.useQuery({
      startDate,
      endDate,
      module: selectedModule !== 'all' ? selectedModule : undefined,
    });

  const { data: recentFailures, refetch: refetchFailures } = 
    trpc.orchestration.getRecentFailures.useQuery({ limit: 10 });

  const handleRefreshAll = () => {
    refetchLogs();
    refetchStats();
    refetchFailures();
    toast.success('Logs refreshed');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">In Progress</Badge>;
      case 'started':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Started</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'started':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-slate-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const isLoading = logsLoading || statsLoading;

  // Filter logs by search query
  const filteredLogs = logs?.filter((log: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.requestId?.toLowerCase().includes(query) ||
      log.module?.toLowerCase().includes(query) ||
      log.operation?.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <SecureAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white">Orchestration Logs</h1>
            </div>
            <p className="text-slate-400">View and analyze system orchestration and workflow logs</p>
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
            Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Operations</CardTitle>
              <Activity className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {systemStats?.totalOperations || filteredLogs.length || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                In selected period
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Success Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {systemStats?.successRate?.toFixed(1) || 
                  (filteredLogs.length > 0 
                    ? ((filteredLogs.filter((l: any) => l.status === 'completed').length / filteredLogs.length) * 100).toFixed(1)
                    : 0)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Completed successfully
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Avg Duration</CardTitle>
              <Clock className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {systemStats?.avgDurationMs 
                  ? formatDuration(systemStats.avgDurationMs)
                  : filteredLogs.length > 0
                  ? formatDuration(
                      filteredLogs.reduce((acc: number, l: any) => acc + (l.duration || 0), 0) / filteredLogs.length
                    )
                  : '0ms'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Per operation
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Failed Operations</CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {systemStats?.failedOperations || 
                  filteredLogs.filter((l: any) => l.status === 'failed').length || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by request ID, module, or operation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              
              <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last 1 hour</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {MODULES.map(m => (
                    <SelectItem key={m} value={m}>
                      {m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-36 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Operation Logs
            </CardTitle>
            <CardDescription className="text-slate-400">
              {filteredLogs.length} operations found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLogs.length > 0 ? (
              <div className="space-y-2">
                {filteredLogs.map((log: any) => (
                  <div 
                    key={log.id || log.requestId}
                    className={`rounded-lg border transition-colors ${
                      expandedLog === log.requestId
                        ? 'bg-slate-800 border-slate-600'
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedLog(
                        expandedLog === log.requestId ? null : log.requestId
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedLog === log.requestId ? (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                          {getStatusIcon(log.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                {log.operation || log.module || 'Unknown Operation'}
                              </span>
                              {getStatusBadge(log.status)}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {log.requestId?.slice(0, 8)}... • 
                              {log.module?.replace(/_/g, ' ')} • 
                              {new Date(log.startTime || log.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white">
                            {log.duration ? formatDuration(log.duration) : '-'}
                          </div>
                          <div className="text-xs text-slate-400">Duration</div>
                        </div>
                      </div>
                    </div>
                    
                    {expandedLog === log.requestId && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-700">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-slate-400">Request ID</div>
                            <div className="text-white font-mono text-xs">{log.requestId}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Module</div>
                            <div className="text-white">{log.module?.replace(/_/g, ' ')}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Start Time</div>
                            <div className="text-white">
                              {new Date(log.startTime || log.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">End Time</div>
                            <div className="text-white">
                              {log.endTime ? new Date(log.endTime).toLocaleString() : '-'}
                            </div>
                          </div>
                        </div>
                        {log.error && (
                          <div className="mt-4 p-3 bg-red-500/10 rounded border border-red-500/20">
                            <div className="text-sm text-red-400 font-medium mb-1">Error</div>
                            <div className="text-xs text-red-300 font-mono">{log.error}</div>
                          </div>
                        )}
                        {log.metadata && (
                          <div className="mt-4">
                            <div className="text-sm text-slate-400 mb-2">Metadata</div>
                            <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-auto max-h-32">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No logs found for the selected filters</p>
                <p className="text-sm mt-2">Try adjusting your filters or time range</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SecureAdminLayout>
  );
}
