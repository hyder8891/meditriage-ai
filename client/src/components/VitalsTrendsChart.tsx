import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Heart, Activity, TrendingUp, Calendar } from "lucide-react";

interface VitalReading {
  id: number;
  heartRate: number | null;
  hrvStressScore: number | null;
  hrvRmssd: string | null;
  hrvSdnn: string | null;
  stressLevel: string | null;
  createdAt: Date | null;
}

interface VitalsTrendsChartProps {
  vitals: VitalReading[];
  title?: string;
  description?: string;
}

type MetricType = "heartRate" | "hrvStress" | "hrvRmssd" | "hrvSdnn";
type TimeRange = "24h" | "7d" | "30d" | "all";

export function VitalsTrendsChart({ vitals, title = "Vital Signs Trends", description }: VitalsTrendsChartProps) {
  const [metric, setMetric] = useState<MetricType>("heartRate");
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [chartType, setChartType] = useState<"line" | "area">("area");

  // Filter data by time range
  const filterByTimeRange = (data: VitalReading[]) => {
    if (timeRange === "all") return data;

    const now = Date.now();
    const ranges = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const cutoff = now - ranges[timeRange];
    return data.filter(v => v.createdAt && new Date(v.createdAt).getTime() >= cutoff);
  };

  // Prepare chart data
  const chartData = filterByTimeRange(vitals)
    .map(v => ({
      timestamp: v.createdAt ? new Date(v.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) : "N/A",
      fullDate: v.createdAt,
      heartRate: v.heartRate,
      hrvStress: v.hrvStressScore,
      hrvRmssd: v.hrvRmssd ? parseFloat(v.hrvRmssd) : null,
      hrvSdnn: v.hrvSdnn ? parseFloat(v.hrvSdnn) : null,
      stressLevel: v.stressLevel,
    }))
    .reverse(); // Show oldest to newest

  // Metric configurations
  const metricConfig = {
    heartRate: {
      label: "Heart Rate (BPM)",
      dataKey: "heartRate",
      color: "#ef4444",
      icon: Heart,
      unit: "BPM",
    },
    hrvStress: {
      label: "HRV Stress Score",
      dataKey: "hrvStress",
      color: "#f59e0b",
      icon: Activity,
      unit: "/100",
    },
    hrvRmssd: {
      label: "HRV RMSSD",
      dataKey: "hrvRmssd",
      color: "#3b82f6",
      icon: TrendingUp,
      unit: "ms",
    },
    hrvSdnn: {
      label: "HRV SDNN",
      dataKey: "hrvSdnn",
      color: "#8b5cf6",
      icon: TrendingUp,
      unit: "ms",
    },
  };

  const currentConfig = metricConfig[metric];
  const MetricIcon = currentConfig.icon;

  // Calculate statistics
  const values = chartData
    .map(d => d[currentConfig.dataKey] as number | null)
    .filter(v => v !== null) as number[];

  const stats = values.length > 0 ? {
    average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
    latest: values[values.length - 1],
  } : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MetricIcon className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          <div className="flex gap-2">
            <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heartRate">Heart Rate</SelectItem>
                <SelectItem value="hrvStress">HRV Stress</SelectItem>
                <SelectItem value="hrvRmssd">HRV RMSSD</SelectItem>
                <SelectItem value="hrvSdnn">HRV SDNN</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1 border rounded-md">
              <Button
                variant={chartType === "line" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("line")}
                className="rounded-r-none"
              >
                Line
              </Button>
              <Button
                variant={chartType === "area" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("area")}
                className="rounded-l-none"
              >
                Area
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Latest</p>
              <p className="text-2xl font-bold">{stats.latest} <span className="text-sm font-normal text-muted-foreground">{currentConfig.unit}</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-2xl font-bold">{stats.average} <span className="text-sm font-normal text-muted-foreground">{currentConfig.unit}</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Min</p>
              <p className="text-2xl font-bold">{stats.min} <span className="text-sm font-normal text-muted-foreground">{currentConfig.unit}</span></p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Max</p>
              <p className="text-2xl font-bold">{stats.max} <span className="text-sm font-normal text-muted-foreground">{currentConfig.unit}</span></p>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No data available for selected time range</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "line" ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: currentConfig.label, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={currentConfig.dataKey} 
                  stroke={currentConfig.color} 
                  strokeWidth={2}
                  dot={{ fill: currentConfig.color, r: 4 }}
                  activeDot={{ r: 6 }}
                  name={currentConfig.label}
                />
              </LineChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`color${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: currentConfig.label, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey={currentConfig.dataKey} 
                  stroke={currentConfig.color} 
                  strokeWidth={2}
                  fill={`url(#color${metric})`}
                  name={currentConfig.label}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
