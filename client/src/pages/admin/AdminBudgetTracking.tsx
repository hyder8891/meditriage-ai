import SecureAdminLayout from '@/components/SecureAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Cpu,
  Zap,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// Chart.js types
declare global {
  interface Window {
    Chart: any;
  }
}

const MODULES = [
  { key: 'brain_clinical_reasoning', label: 'Clinical Reasoning', color: '#3b82f6' },
  { key: 'pharma_guard', label: 'PharmaGuard', color: '#10b981' },
  { key: 'medical_imaging', label: 'Medical Imaging', color: '#8b5cf6' },
  { key: 'lab_results', label: 'Lab Results', color: '#f59e0b' },
  { key: 'medical_reports', label: 'Medical Reports', color: '#ec4899' },
  { key: 'symptom_checker', label: 'Symptom Checker', color: '#06b6d4' },
  { key: 'soap_notes', label: 'SOAP Notes', color: '#84cc16' },
  { key: 'bio_scanner', label: 'Bio Scanner', color: '#f97316' },
  { key: 'voice_transcription', label: 'Voice Transcription', color: '#6366f1' },
  { key: 'image_generation', label: 'Image Generation', color: '#a855f7' },
  { key: 'conversation_ai', label: 'Conversation AI', color: '#14b8a6' },
] as const;

export default function AdminBudgetTracking() {
  const [selectedModule, setSelectedModule] = useState<string>('brain_clinical_reasoning');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const moduleChartRef = useRef<HTMLCanvasElement>(null);
  const trendChartRef = useRef<HTMLCanvasElement>(null);

  // Get date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (dateRange) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const { startDate, endDate } = getDateRange();

  const { data: myUsage, isLoading: myUsageLoading, refetch: refetchMyUsage } = 
    trpc.budget.getMyUsageStats.useQuery({ startDate, endDate });

  const { data: moduleStats, isLoading: moduleLoading, refetch: refetchModule } = 
    trpc.budget.getModuleStats.useQuery({ 
      module: selectedModule as any, 
      startDate, 
      endDate 
    });

  const { data: budgetLimit, isLoading: budgetLoading, refetch: refetchBudget } = 
    trpc.budget.checkMyBudgetLimit.useQuery();

  const { data: allUsersStats, isLoading: allUsersLoading, refetch: refetchAllUsers } = 
    trpc.budget.getAllUsersStats.useQuery({ startDate, endDate });

  // Load Chart.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.onload = () => setChartsLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Render charts
  useEffect(() => {
    if (!chartsLoaded || !window.Chart) return;

    // Module Distribution Chart (Pie)
    if (moduleChartRef.current) {
      const ctx = moduleChartRef.current.getContext('2d');
      if (ctx) {
        // Clear existing chart
        const existingChart = window.Chart.getChart(moduleChartRef.current);
        if (existingChart) existingChart.destroy();

        // Simulated data based on modules
        const data = MODULES.map((m, i) => Math.floor(Math.random() * 100) + 10);
        
        new window.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: MODULES.map(m => m.label),
            datasets: [{
              data,
              backgroundColor: MODULES.map(m => m.color),
              borderWidth: 0,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: 'rgb(148, 163, 184)',
                  padding: 10,
                  font: { size: 11 }
                }
              }
            }
          }
        });
      }
    }

    // Trend Chart (Line)
    if (trendChartRef.current) {
      const ctx = trendChartRef.current.getContext('2d');
      if (ctx) {
        // Clear existing chart
        const existingChart = window.Chart.getChart(trendChartRef.current);
        if (existingChart) existingChart.destroy();

        // Generate labels based on date range
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const labels = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        // Simulated cost data
        const costData = labels.map(() => Math.random() * 5 + 1);
        const requestData = labels.map(() => Math.floor(Math.random() * 50) + 10);

        new window.Chart(ctx, {
          type: 'line',
          data: {
            labels: labels.filter((_, i) => i % Math.ceil(days / 10) === 0),
            datasets: [
              {
                label: 'Cost ($)',
                data: costData.filter((_, i) => i % Math.ceil(days / 10) === 0),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
              },
              {
                label: 'Requests',
                data: requestData.filter((_, i) => i % Math.ceil(days / 10) === 0),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y1',
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                labels: { color: 'rgb(148, 163, 184)' }
              }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                ticks: { color: 'rgb(148, 163, 184)' }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: 'rgb(148, 163, 184)' }
              },
              x: {
                grid: { display: false },
                ticks: { color: 'rgb(148, 163, 184)' }
              }
            }
          }
        });
      }
    }
  }, [chartsLoaded, dateRange]);

  const handleRefreshAll = () => {
    refetchMyUsage();
    refetchModule();
    refetchBudget();
    refetchAllUsers();
    toast.success('Data refreshed');
  };

  const isLoading = myUsageLoading || moduleLoading || budgetLoading || allUsersLoading;

  // Calculate budget usage percentage
  const budgetUsagePercent = budgetLimit 
    ? Math.min((budgetLimit.currentUsageCents / budgetLimit.limitAmountCents) * 100, 100)
    : 0;

  return (
    <SecureAdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white">Budget Tracking</h1>
            </div>
            <p className="text-slate-400">Monitor API usage costs and budget allocation</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
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
        </div>

        {/* Budget Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Spent</CardTitle>
              <DollarSign className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${((myUsage?.totalCostCents || 0) / 100).toFixed(2)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                This period
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Requests</CardTitle>
              <Activity className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {myUsage?.totalRequests || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                API calls made
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Tokens</CardTitle>
              <Cpu className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {((myUsage?.totalTokens || 0) / 1000).toFixed(1)}K
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tokens processed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Avg Cost/Request</CardTitle>
              <Zap className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${myUsage?.totalRequests 
                  ? ((myUsage.totalCostCents / myUsage.totalRequests) / 100).toFixed(4)
                  : '0.00'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Per API call
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Limit Progress */}
        {budgetLimit && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Budget Usage</CardTitle>
                  <CardDescription className="text-slate-400">
                    Current spending against your budget limit
                  </CardDescription>
                </div>
                <Badge className={
                  budgetUsagePercent >= 90 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : budgetUsagePercent >= 70
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-green-500/20 text-green-400 border-green-500/30'
                }>
                  {budgetUsagePercent.toFixed(1)}% Used
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress 
                  value={budgetUsagePercent} 
                  className={`h-3 ${
                    budgetUsagePercent >= 90 ? '[&>div]:bg-red-500' :
                    budgetUsagePercent >= 70 ? '[&>div]:bg-yellow-500' : ''
                  }`}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Spent: <span className="text-white font-medium">
                      ${(budgetLimit.currentUsageCents / 100).toFixed(2)}
                    </span>
                  </span>
                  <span className="text-slate-400">
                    Limit: <span className="text-white font-medium">
                      ${(budgetLimit.limitAmountCents / 100).toFixed(2)}
                    </span>
                  </span>
                  <span className="text-slate-400">
                    Remaining: <span className="text-green-400 font-medium">
                      ${((budgetLimit.limitAmountCents - budgetLimit.currentUsageCents) / 100).toFixed(2)}
                    </span>
                  </span>
                </div>
                {budgetUsagePercent >= 90 && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-400">
                      Warning: You are approaching your budget limit
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Usage Trend Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Usage Trend
              </CardTitle>
              <CardDescription className="text-slate-400">
                Cost and request volume over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <canvas ref={trendChartRef}></canvas>
              </div>
            </CardContent>
          </Card>

          {/* Module Distribution Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                Module Distribution
              </CardTitle>
              <CardDescription className="text-slate-400">
                Usage breakdown by module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <canvas ref={moduleChartRef}></canvas>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Details */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Module Statistics</CardTitle>
                <CardDescription className="text-slate-400">
                  Detailed usage statistics by module
                </CardDescription>
              </div>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map(m => (
                    <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {moduleStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {moduleStats.totalRequests || 0}
                  </div>
                  <div className="text-sm text-slate-400">Total Requests</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    ${((moduleStats.totalCostCents || 0) / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-400">Total Cost</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {((moduleStats.totalTokens || 0) / 1000).toFixed(1)}K
                  </div>
                  <div className="text-sm text-slate-400">Total Tokens</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    {(moduleStats as any).avgResponseTime?.toFixed(0) || 0}ms
                  </div>
                  <div className="text-sm text-slate-400">Avg Response Time</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No data available for this module</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Modules Overview */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">All Modules Overview</CardTitle>
            <CardDescription className="text-slate-400">
              Quick view of all module usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {MODULES.map(module => (
                <div 
                  key={module.key}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedModule === module.key 
                      ? 'bg-slate-700 border-slate-600' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                  }`}
                  onClick={() => setSelectedModule(module.key)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{module.label}</span>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: module.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Click to view details</span>
                    <span style={{ color: module.color }}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SecureAdminLayout>
  );
}
